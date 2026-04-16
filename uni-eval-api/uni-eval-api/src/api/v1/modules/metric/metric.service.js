const repo = require('./metric.repository');
const { analyzeFromAggregated } = require('../ai/comment-analysis.service');
const path = require('path');
const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
/**
 * Format a Date or date-like value to YYYY-MM-DD.
 * Falls back to empty string if invalid.
 */
function formatDate(value) {
    if (!value) return '';
    try {
        const d = new Date(value);
        if (isNaN(d.getTime())) return '';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    } catch {
        return '';
    }
}
/**
 * Format current date-time in America/Bogota timezone.
 * Returns string like YYYY-MM-DD HH:mm:ss (America/Bogota).
 */
function formatDateTimeBogota(value) {
    const d = value ? new Date(value) : new Date();
    if (isNaN(d.getTime())) return '';
    const fmt = new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    // es-CO gives DD/MM/YYYY, convert to YYYY-MM-DD
    const parts = fmt.formatToParts(d);
    const by = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const date = `${by.year}-${by.month}-${by.day}`;
    const time = `${by.hour}:${by.minute}:${by.second}`;
    return `${date} ${time}`;
}

async function evaluationSummary(query) {
	return repo.getEvaluationSummary(query);
}

async function evaluationSummaryByProgram(query) {
    return repo.getEvaluationSummaryByProgram(query);
}

async function docenteStats(query, search, sort) {
	const { page, limit, ...filterQuery } = query;
	if (!filterQuery.docente) {
		return repo.getAllDocentesStats({ ...filterQuery, page: parseInt(page) || 1, limit: parseInt(limit) || 10 }, search, sort);
	}
	return repo.getDocenteStats(filterQuery);
}

async function ranking(query) {
	return repo.getRanking(query);
}

async function docenteAspectMetrics(query) {
    return repo.getDocenteAspectMetrics(query);
}

async function docenteMateriaMetrics(query) {
    return repo.getDocenteMateriaMetrics(query);
}

async function docenteMateriaCompletion(query) {
    return repo.getDocenteMateriaCompletion(query);
}

async function docenteComments(query) {
    const { userPrisma } = require('../../../../prisma/clients');
    
    // Obtener datos de métricas
    const metricsData = await repo.getDocenteCommentsWithMetrics(query);
    
    // Recuperar el nombre del docente desde userPrisma.vista_academica_insitus
    if (query.docente) {
        try {
            const docente = await userPrisma.vista_academica_insitus.findFirst({
                where: { 
                    ID_DOCENTE: String(query.docente),
                    NOT: { DOCENTE: 'DOCENTE SIN ASIGNAR' }
                },
                select: { DOCENTE: true, ID_DOCENTE: true }
            });
            
            if (docente) {
                metricsData.docente_nombre = docente.DOCENTE;
                metricsData.docente_id = docente.ID_DOCENTE;
            }
        } catch (e) {
            console.warn(`[docenteComments] Error recuperando nombre del docente: ${e.message}`);
        }
    }
    
    return metricsData;
}

function parseJsonSafe(text, fallback = {}) {
    if (text == null) return fallback;
    if (typeof text === 'object') return text; // Already parsed JSON from Prisma
    if (typeof text !== 'string') return fallback;
    try { return JSON.parse(text); } catch {}
    const match = text.match(/[\[{][\s\S]*[\]}]/);
    if (match) {
        try { return JSON.parse(match[0]); } catch {}
    }
    return fallback;
}

function hasTextComments(data) {
    const general = Array.isArray(data?.cmt_gen) ? data.cmt_gen : [];
    const hasGeneral = general.some((c) => String(c || '').trim().length > 0);
    if (hasGeneral) return true;

    const aspectos = Array.isArray(data?.aspectos) ? data.aspectos : [];
    return aspectos.some((asp) => {
        const comments = Array.isArray(asp?.cmt) ? asp.cmt : [];
        return comments.some((c) => String(c || '').trim().length > 0);
    });
}

async function mapWithConcurrency(items, concurrency, mapper) {
    if (!Array.isArray(items) || !items.length) return [];
    const limit = Math.max(1, Number(concurrency) || 1);
    const results = new Array(items.length);
    let current = 0;

    async function worker() {
        while (true) {
            const idx = current;
            current += 1;
            if (idx >= items.length) return;
            results[idx] = await mapper(items[idx], idx);
        }
    }

    const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
    await Promise.all(workers);
    return results;
}

async function deleteCmtAiCompat(localPrisma, { cfgId, docente, codigo_materia }) {
    try {
        await localPrisma.cmt_ai.deleteMany({
            where: {
                cfg_t_id: cfgId,
                docente: String(docente),
                codigo_materia: String(codigo_materia)
            }
        });
    } catch (err) {
        if (String(err?.message || '').includes('Unknown argument `docente`')) {
            await localPrisma.cmt_ai.deleteMany({
                where: { cfg_t_id: cfgId }
            });
            return;
        }
        throw err;
    }
}

async function createCmtAiCompat(localPrisma, records) {
    if (!records.length) return;
    try {
        await localPrisma.cmt_ai.createMany({ data: records });
    } catch (err) {
        if (String(err?.message || '').includes('Unknown argument `docente`')) {
            const sanitized = records.map((r) => ({
                cfg_t_id: r.cfg_t_id,
                aspecto_id: r.aspecto_id,
                conclusion: r.conclusion,
                conclusion_gen: r.conclusion_gen,
                fortaleza: r.fortaleza,
                debilidad: r.debilidad
            }));
            await localPrisma.cmt_ai.createMany({ data: sanitized });
            return;
        }
        throw err;
    }
}

async function docenteCommentsAnalysis(query) {
	const { localPrisma } = require('../../../../prisma/clients');
	const cfgId = Number(query.cfg_t);
	
	// 1. Obtener todas las materias del docente para esta configuración
	const evalRecords = await localPrisma.eval.findMany({
		where: {
			id_configuracion: cfgId,
			docente: String(query.docente)
		},
		select: { codigo_materia: true },
		distinct: ['codigo_materia']
	});
	
	const materias = evalRecords
		.map(r => r.codigo_materia)
		.filter(Boolean);
	
	// Si se especifica una materia, analizar solo esa
	const materiasAAnalizar = query.codigo_materia ? [String(query.codigo_materia)] : materias;
	
	if (!materiasAAnalizar.length) {
		return {
			success: false,
			message: 'No hay evaluaciones para analizar'
		};
	}
	
    // 2. Analizar materias con concurrencia controlada
    const resultadosRaw = await mapWithConcurrency(materiasAAnalizar, 2, async (codigo_materia) => {
        const dataMateria = await repo.getDocenteCommentsWithMetrics({
            ...query,
            codigo_materia
        });

        if (!dataMateria.total_respuestas) {
            return {
                codigo_materia,
                estado: 'sin_respuestas'
            };
        }

        const hasComments = hasTextComments(dataMateria);

        // 3. Limpiar registros previos para este docente, materia y cfg_t
        await deleteCmtAiCompat(localPrisma, {
            cfgId,
            docente: query.docente,
            codigo_materia
        });

        if (!hasComments) {
            return {
                codigo_materia,
                estado: 'sin_comentarios'
            };
        }

        const analisisIA = await analyzeFromAggregated(dataMateria, query.docente);

        if (analisisIA.analisis) {
            const cmtAiRecords = [];
            for (const aspecto of analisisIA.analisis.aspectos || []) {
                cmtAiRecords.push({
                    cfg_t_id: cfgId,
                    docente: String(query.docente),
                    codigo_materia: String(codigo_materia),
                    aspecto_id: aspecto.aspecto_id,
                    conclusion: aspecto.conclusion || null,
                    conclusion_gen: analisisIA.analisis.conclusion_general || null,
                    fortaleza: analisisIA.analisis.fortalezas || [],
                    debilidad: analisisIA.analisis.debilidades || []
                });
            }

            await createCmtAiCompat(localPrisma, cmtAiRecords);
        }

        return {
            codigo_materia,
            estado: 'analizado',
            analisis: analisisIA
        };
    });

    const resultados = resultadosRaw.filter(Boolean);
	
	// 4. Retornar el análisis generado
	return {
		success: true,
		docente: query.docente,
		materias_analizadas: materiasAAnalizar,
		resultados
	};
}

async function generateDocxReport({
    cfg_t,
    docente,
    codigo_materia,
    ai_mode,
    sede,
    periodo,
    programa,
    semestre,
    grupo
}) {
    if (!cfg_t || !docente) throw new Error('cfg_t y docente son requeridos');

    const { localPrisma } = require('../../../../prisma/clients');
    const cfgId = Number(cfg_t);

    // ================================
    // 1. Obtener datos para Word
    // - docenteAspectMetrics: fuente oficial de métricas por aspecto (lo pintado en Word)
    // - docenteComments: comentarios + conclusiones IA/cache
    // ================================
    const aspectData = await docenteAspectMetrics({
        cfg_t,
        docente,
        codigo_materia,
        sede,
        periodo,
        programa,
        semestre,
        grupo
    });

    const metricsData = await docenteComments({
        cfg_t,
        docente,
        codigo_materia,
        sede,
        periodo,
        programa,
        semestre,
        grupo
    });

    // Métricas por materia del docente
    const materiasStats = await repo.getDocenteMateriaMetrics({ cfg_t, docente, sede, periodo, programa, semestre, grupo });
    const materias = (materiasStats?.materias || []).map(m => {
        const hasStudentResponses = Number(m.total_realizadas || 0) > 0;
        const weightedOrStudentAvg = m.nota_final_ponderada ?? m.promedio_general;
        const promedioMateria = hasStudentResponses && weightedOrStudentAvg != null
            ? Number(Number(weightedOrStudentAvg).toFixed(2))
            : 0.0;

        return {
            codigo_materia: String(m.codigo_materia || ''),
            nombre_materia: m.nombre_materia || String(m.codigo_materia || ''),
            promedio_general: promedioMateria,
            total_realizadas: Number(m.total_realizadas || 0)
        };
    });

    const evaluacionEstudiantes = aspectData?.evaluacion_estudiantes || {};
    const autoevaluacionDocente = aspectData?.autoevaluacion_docente || {};
    const pesoEvaluacion = typeof evaluacionEstudiantes?.peso === 'number' ? evaluacionEstudiantes.peso : 0.8;
    const pesoAutoevaluacion = typeof autoevaluacionDocente?.peso === 'number' ? autoevaluacionDocente.peso : 0.2;

    const evalAspectos = Array.isArray(evaluacionEstudiantes?.aspectos)
        ? evaluacionEstudiantes.aspectos
        : [];
    const autoAspectos = Array.isArray(autoevaluacionDocente?.aspectos)
        ? autoevaluacionDocente.aspectos
        : [];

    const aspectSource = evalAspectos.length
        ? evalAspectos
        : (Array.isArray(metricsData?.aspectos) ? metricsData.aspectos : []);

    if (!aspectSource.length) {
        throw new Error('No hay evaluaciones para este docente/materia');
    }
    
    // Usar el nombre del docente recuperado o el ID
    const docenteNombre = metricsData.docente_nombre || docente;
    const docenteDocumento = metricsData.docente_id || docente || '';
    const materiaSeleccionada = codigo_materia
        ? materias.find(m => m.codigo_materia === String(codigo_materia))
        : materias[0];
    const asignaturaNombre = materiaSeleccionada?.nombre_materia || (codigo_materia ? String(codigo_materia) : '');
    const asignaturaCodigo = materiaSeleccionada?.codigo_materia || (codigo_materia ? String(codigo_materia) : '');

    // ================================
    // 2. Preparar aspectos con formato para el reporte
    // ================================
    const aiConclusionByAspectId = new Map(
        (Array.isArray(metricsData?.aspectos) ? metricsData.aspectos : [])
            .filter((asp) => asp?.aspecto_id != null)
            .map((asp) => [asp.aspecto_id, asp.conclusion || ''])
    );

    const autoAspectById = new Map(
        autoAspectos
            .filter((asp) => asp?.aspecto_id != null)
            .map((asp) => [asp.aspecto_id, asp])
    );

    const allAspectIds = Array.from(new Set([
        ...aspectSource.map((asp) => asp?.aspecto_id).filter((id) => id != null),
        ...autoAspectos.map((asp) => asp?.aspecto_id).filter((id) => id != null)
    ]));

    const aspectById = new Map(
        aspectSource
            .filter((asp) => asp?.aspecto_id != null)
            .map((asp) => [asp.aspecto_id, asp])
    );

    const aspectos = allAspectIds.map((aspectoId) => {
        const evalAsp = aspectById.get(aspectoId) || {};
        const autoAsp = autoAspectById.get(aspectoId) || {};

        const promedioEval = typeof evalAsp.promedio === 'number' ? evalAsp.promedio : null;
        const promedioAuto = typeof autoAsp.promedio === 'number' ? autoAsp.promedio : null;
        const promedioPonderado = ((promedioEval ?? 0) * pesoEvaluacion) + ((promedioAuto ?? 0) * pesoAutoevaluacion);
        const promedioEvalNum = Number((promedioEval ?? 0).toFixed(2));
        const promedioAutoNum = Number((promedioAuto ?? 0).toFixed(2));
        const promedioFinalNum = Number(promedioPonderado.toFixed(2));

        return {
            aspecto_id: aspectoId,
            aspecto_nombre: evalAsp.nombre || autoAsp.nombre || `Aspecto ${aspectoId}`,
            suma: evalAsp.suma || 0,
            promedio: promedioFinalNum,
            desviacion: evalAsp.desviacion != null ? Number(evalAsp.desviacion.toFixed(2)) : 0,
            total_respuestas: evalAsp.total_respuestas || 0,
            promedio_estudiantes: promedioEvalNum,
            promedio_autoevaluacion: promedioAutoNum,
            peso_evaluacion: Number(pesoEvaluacion.toFixed(2)),
            peso_autoevaluacion: Number(pesoAutoevaluacion.toFixed(2)),
            formula_aspecto: `${promedioEvalNum.toFixed(2)} x ${Number(pesoEvaluacion.toFixed(2)).toFixed(2)} + ${promedioAutoNum.toFixed(2)} x ${Number(pesoAutoevaluacion.toFixed(2)).toFixed(2)} = ${promedioFinalNum.toFixed(2)}`,
            conclusion: aiConclusionByAspectId.get(aspectoId) || ''
        };
    });

    // ================================
    // 3. Usar métricas calculadas del repository
    // ================================
    const promedioGeneralSrc = aspectData?.resultado_final?.nota_final_ponderada
        ?? aspectData?.evaluacion_estudiantes?.promedio_general;
    const desviacionGeneralSrc = aspectData?.evaluacion_estudiantes?.desviacion;

    const promedioGeneral = promedioGeneralSrc != null 
        ? Number(promedioGeneralSrc.toFixed(2)) 
        : 0;
    const desviacionGeneral = desviacionGeneralSrc != null 
        ? Number(desviacionGeneralSrc.toFixed(2)) 
        : 0;
    const porcentajeCumplimiento = metricsData.porcentaje_cumplimiento || 0;

    // ================================
    // 4. Obtener conclusiones, fortalezas y debilidades
    // ================================
    const mode = String(ai_mode || 'cached').toLowerCase();
    const useAiConclusions = mode !== 'none';
    const conclusionGen = useAiConclusions ? (metricsData.conclusion_gen || '') : '';
    const fortalezas = useAiConclusions && Array.isArray(metricsData.fortalezas) ? metricsData.fortalezas : [];
    const debilidades = useAiConclusions && Array.isArray(metricsData.debilidades) ? metricsData.debilidades : [];

    // ================================
    // 5. Cargar la plantilla DOCX
    // ================================
    const templatePath = path.resolve(__dirname, '../../templates/Carta_UniPutumayo.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    // Preparar módulo de imágenes
    let imageModule = null;
    let imageModulePresent = false;
    try {
        let ImageModule;
        try {
            ImageModule = require('docxtemplater-image-module-free');
        } catch (e1) {
            try {
                ImageModule = require('docxtemplater-image-module');
            } catch (e2) {
                console.warn('[docx-report] No image module found:', e1.message);
                throw e2;
            }
        }
        imageModule = new ImageModule({
            getImage: function(tagValue) {
                if (Buffer.isBuffer(tagValue)) return tagValue;
                if (typeof tagValue === 'string' && tagValue.startsWith('data:image/')) {
                    const base64 = tagValue.split(',')[1];
                    return Buffer.from(base64, 'base64');
                }
                return tagValue;
            },
            getSize: function() { return [666, 450]; },
        });
        imageModulePresent = true;
    } catch (e) {
        console.warn('[docx-report] Failed to prepare image module:', e.message);
    }

    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '[[', end: ']]' },
        modules: imageModulePresent ? [imageModule] : [],
    });

    // ================================
    // 6. Generar gráfica de barras
    // ================================
    let chartBuffer = null;
    const labels = aspectos.map(a => a.aspecto_nombre);
    const values = aspectos.map(a => a.promedio);
    const chartConfiguration = {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Promedio por aspecto',
                    data: values,
                    backgroundColor: '#1976d2',
                },
            ],
        },
        options: {
            indexAxis: 'y',
            responsive: false,
            plugins: {
                legend: { display: false },
                title: { display: false },
                tooltip: { enabled: true },
            },
            scales: {
                x: { beginAtZero: true, suggestedMax: 2 },
                y: { ticks: { maxRotation: 0, minRotation: 0 } },
            },
        },
    };
    
    try {
        const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
        const width = 666;
        const height = 450;
        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
        chartBuffer = await chartJSNodeCanvas.renderToBuffer(chartConfiguration);
    } catch (err) {
        chartBuffer = null;
    }

    if (chartBuffer) {
        try {
            const outDir = path.resolve(process.cwd(), 'tmp');
            if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
            const outPath = path.join(outDir, 'chart.png');
            fs.writeFileSync(outPath, chartBuffer);
        } catch (e) {
            console.warn('[docx-report] Failed to write chart.png:', e.message);
        }
    }

    // ================================
    // 7. Preparar datos para el DOCX
    // ================================
    
    // Construir lista de contexto
    const contexto_list = [];
    if (sede) contexto_list.push({ label: 'Sede', value: sede });
    if (periodo) contexto_list.push({ label: 'Período', value: periodo });
    if (programa) contexto_list.push({ label: 'Programa', value: programa });
    if (semestre) contexto_list.push({ label: 'Semestre', value: semestre });
    if (grupo) contexto_list.push({ label: 'Grupo', value: grupo });
    
    const data = {
        // Información básica
        docente_nombre: docenteNombre,
        docente_documento: docenteDocumento,
        docente: docenteDocumento, // Para plantillas que usen [[docente]]
        asignatura_nombre: asignaturaNombre,
        asignatura_codigo: asignaturaCodigo,
        materias,

        // Fechas
        informe_fecha: formatDate(Date.now()),
        informe_fecha_hora: formatDateTimeBogota(Date.now()),

        // Contexto
        contexto_list,

        // Gráfica
        has_chart: Boolean(chartBuffer && imageModulePresent),
        chart_image: (chartBuffer && imageModulePresent)
            ? `data:image/png;base64,${chartBuffer.toString('base64')}`
            : undefined,

        // Métricas
        promedio_general: promedioGeneral,
        desviacion_general: desviacionGeneral,
        porcentaje_cumplimiento: Number(porcentajeCumplimiento.toFixed(2)),
        promedio_estudiantes_general: evaluacionEstudiantes?.promedio_general ?? 0,
        promedio_autoevaluacion_general: autoevaluacionDocente?.promedio_general ?? 0,
        nota_final_ponderada: aspectData?.resultado_final?.nota_final_ponderada ?? promedioGeneral,
        peso_evaluacion_estudiantes: pesoEvaluacion,
        peso_autoevaluacion_docente: pesoAutoevaluacion,
        formula_nota_final: `${Number(evaluacionEstudiantes?.promedio_general ?? 0).toFixed(2)} x ${Number(pesoEvaluacion).toFixed(2)} + ${Number(autoevaluacionDocente?.promedio_general ?? 0).toFixed(2)} x ${Number(pesoAutoevaluacion).toFixed(2)} = ${Number(aspectData?.resultado_final?.nota_final_ponderada ?? promedioGeneral).toFixed(2)}`,

        total_evaluaciones: metricsData.total_evaluaciones || 0,
        total_realizadas: metricsData.total_realizadas || 0,
        total_pendientes: metricsData.total_pendientes || 0,

        // Aspectos con conclusión corregida
        aspectos: aspectos.map(asp => ({
            ...asp,
            ai_conclusion: useAiConclusions ? (asp.conclusion || '') : ''
        })),

        // Conclusiones (nombres ajustados a plantilla)
        ai_conclusion_general: conclusionGen,
        ai_fortalezas_generales: fortalezas,
        ai_debilidades_generales: debilidades,
    };

    try {
        doc.render(data);
    } catch (e) {
        const explanation = e.properties?.explanation || e.message;
        throw new Error(`Error en plantilla DOCX: ${explanation}`);
    }

    return doc.getZip().generate({ type: 'nodebuffer' });
}

/**
 * Obtiene todos los docentes de un programa con sus métricas y análisis IA cacheado.
 * Retorna rankings de mejores y con más aspectos de mejora.
 */
async function getReportePrograma(query) {
    const { localPrisma } = require('../../../../prisma/clients');
    const cfgId = Number(query.cfg_t);
    if (!cfgId) throw new Error('cfg_t es requerido');

    // Todos los docentes del programa (sin paginación límite alto)
    const docentesResult = await repo.getAllDocentesStats(
        { ...query, page: 1, limit: 200 },
        {},
        { sortBy: 'promedio_general', sortOrder: 'desc' }
    );
    const docentes = docentesResult.data || [];
    const docenteIds = docentes.map(d => d.docente).filter(Boolean);

    // Obtener análisis IA cacheado de cmt_ai para todos los docentes
    let cmtAiAll = [];
    if (docenteIds.length) {
        try {
            cmtAiAll = await localPrisma.cmt_ai.findMany({
                where: { cfg_t_id: cfgId, docente: { in: docenteIds } },
                select: { docente: true, conclusion_gen: true, fortaleza: true, debilidad: true }
            });
        } catch (err) {
            if (String(err?.message || '').includes('Unknown argument `docente`')) {
                cmtAiAll = await localPrisma.cmt_ai.findMany({
                    where: { cfg_t_id: cfgId },
                    select: { conclusion_gen: true, fortaleza: true, debilidad: true }
                });
            } else throw err;
        }
    }

    // Agrupar AI por docente
    const aiByDocente = new Map();
    for (const rec of cmtAiAll) {
        const docId = rec.docente;
        if (!docId) continue;
        const existing = aiByDocente.get(docId) || { fortalezas: new Set(), debilidades: new Set(), conclusion_gen: null };
        if (rec.conclusion_gen && !existing.conclusion_gen) existing.conclusion_gen = rec.conclusion_gen;
        const forts = parseJsonSafe(rec.fortaleza, []);
        const debs = parseJsonSafe(rec.debilidad, []);
        forts.forEach(f => { if (f) existing.fortalezas.add(f); });
        debs.forEach(d => { if (d) existing.debilidades.add(d); });
        aiByDocente.set(docId, existing);
    }

    // Combinar docentes con IA
    const docentesConAI = docentes.map(d => {
        const ai = aiByDocente.get(d.docente);
        return {
            ...d,
            ai_analisis: ai ? {
                conclusion_gen: ai.conclusion_gen,
                fortalezas: Array.from(ai.fortalezas),
                debilidades: Array.from(ai.debilidades),
                tiene_analisis: true
            } : { fortalezas: [], debilidades: [], conclusion_gen: null, tiene_analisis: false }
        };
    });

    // Aspectos agregados del programa
    const aspectoData = await repo.getDocenteAspectMetrics(query);

    // Rankings
    const conPuntaje = docentesConAI.filter(d => d.promedio_general != null);
    const mejoresDocentes = [...conPuntaje]
        .sort((a, b) => (b.promedio_general || 0) - (a.promedio_general || 0))
        .slice(0, 5);
    const docentesConMejora = [...conPuntaje]
        .sort((a, b) => (a.promedio_general || 0) - (b.promedio_general || 0))
        .slice(0, 5);

    return {
        programa: query.programa || 'Todos los programas',
        total_docentes: docentes.length,
        docentes: docentesConAI,
        aspectos: aspectoData,
        rankings: {
            mejores_docentes: mejoresDocentes,
            docentes_con_mejora: docentesConMejora
        }
    };
}

/**
 * Reporte consolidado: agrupa programas por sede (o todos si no se filtra por sede).
 * Incluye top docentes y docentes con aspectos de mejora por programa.
 */
async function getReporteConsolidado(query) {
    const { localPrisma } = require('../../../../prisma/clients');
    const cfgId = Number(query.cfg_t);
    if (!cfgId) throw new Error('cfg_t es requerido');

    // Obtener resumen por programas
    const { programas } = await repo.getEvaluationSummaryByProgram(query);

    // Para cada programa, obtener top docentes
    const programasConDocentes = await Promise.all(
        programas.map(async (prog) => {
            try {
                const docentesResult = await repo.getAllDocentesStats(
                    { ...query, programa: prog.nombre, page: 1, limit: 100 },
                    {},
                    { sortBy: 'promedio_general', sortOrder: 'desc' }
                );
                const docentes = docentesResult.data || [];

                // AI cacheada
                const docenteIds = docentes.map(d => d.docente).filter(Boolean);
                let cmtAiAll = [];
                if (docenteIds.length) {
                    try {
                        cmtAiAll = await localPrisma.cmt_ai.findMany({
                            where: { cfg_t_id: cfgId, docente: { in: docenteIds } },
                            select: { docente: true, conclusion_gen: true, fortaleza: true, debilidad: true }
                        });
                    } catch (err) {
                        if (!String(err?.message || '').includes('Unknown argument `docente`')) throw err;
                    }
                }

                const aiByDocente = new Map();
                for (const rec of cmtAiAll) {
                    if (!rec.docente) continue;
                    const ex = aiByDocente.get(rec.docente) || { fortalezas: new Set(), debilidades: new Set(), conclusion_gen: null };
                    if (rec.conclusion_gen && !ex.conclusion_gen) ex.conclusion_gen = rec.conclusion_gen;
                    parseJsonSafe(rec.fortaleza, []).forEach(f => { if (f) ex.fortalezas.add(f); });
                    parseJsonSafe(rec.debilidad, []).forEach(d => { if (d) ex.debilidades.add(d); });
                    aiByDocente.set(rec.docente, ex);
                }

                const docentesConAI = docentes.map(d => ({
                    ...d,
                    ai_analisis: (() => {
                        const ai = aiByDocente.get(d.docente);
                        return ai ? {
                            conclusion_gen: ai.conclusion_gen,
                            fortalezas: Array.from(ai.fortalezas),
                            debilidades: Array.from(ai.debilidades),
                            tiene_analisis: true
                        } : { fortalezas: [], debilidades: [], conclusion_gen: null, tiene_analisis: false };
                    })()
                }));

                const conPuntaje = docentesConAI.filter(d => d.promedio_general != null);
                const promedio_programa = conPuntaje.length
                    ? conPuntaje.reduce((s, d) => s + (d.promedio_general || 0), 0) / conPuntaje.length
                    : null;

                return {
                    ...prog,
                    promedio_programa: promedio_programa != null ? Number(promedio_programa.toFixed(2)) : null,
                    total_docentes: docentes.length,
                    docentes: docentesConAI,
                    mejores_docentes: [...conPuntaje].sort((a, b) => (b.promedio_general || 0) - (a.promedio_general || 0)).slice(0, 3),
                    docentes_con_mejora: [...conPuntaje].sort((a, b) => (a.promedio_general || 0) - (b.promedio_general || 0)).slice(0, 3)
                };
            } catch {
                return { ...prog, promedio_programa: null, total_docentes: 0, docentes: [], mejores_docentes: [], docentes_con_mejora: [] };
            }
        })
    );

    return {
        sede: query.sede || 'Todas las sedes',
        programas: programasConDocentes
    };
}

/**
 * Reporte institucional: agrega todas las sedes con sus programas y métricas globales.
 */
async function getReporteInstitucional(query) {
    const { userPrisma, localPrisma } = require('../../../../prisma/clients');
    const cfgId = Number(query.cfg_t);
    if (!cfgId) throw new Error('cfg_t es requerido');

    // Obtener todas las sedes disponibles
    const sedesRaw = await userPrisma.vista_academica_insitus.findMany({
        where: query.periodo ? { PERIODO: query.periodo } : {},
        select: { NOMBRE_SEDE: true },
        distinct: ['NOMBRE_SEDE']
    });
    const sedes = sedesRaw.map(s => s.NOMBRE_SEDE).filter(Boolean);

    // Resumen global sin filtro de sede
    const globalSummary = await repo.getEvaluationSummaryByProgram({ ...query });

    // Para cada sede, obtener sus programas y métricas
    const sedesData = await Promise.all(
        sedes.map(async (sede) => {
            const { programas } = await repo.getEvaluationSummaryByProgram({ ...query, sede });
            const docentesResult = await repo.getAllDocentesStats(
                { ...query, sede, page: 1, limit: 200 },
                {},
                { sortBy: 'promedio_general', sortOrder: 'desc' }
            );
            const docentes = docentesResult.data || [];
            const conPuntaje = docentes.filter(d => d.promedio_general != null);
            const promedio_sede = conPuntaje.length
                ? Number((conPuntaje.reduce((s, d) => s + (d.promedio_general || 0), 0) / conPuntaje.length).toFixed(2))
                : null;

            // AI para top/bottom
            const docenteIds = conPuntaje.map(d => d.docente).filter(Boolean);
            let cmtAiAll = [];
            if (docenteIds.length) {
                try {
                    cmtAiAll = await localPrisma.cmt_ai.findMany({
                        where: { cfg_t_id: cfgId, docente: { in: docenteIds } },
                        select: { docente: true, conclusion_gen: true, fortaleza: true, debilidad: true }
                    });
                } catch (err) {
                    if (!String(err?.message || '').includes('Unknown argument `docente`')) throw err;
                }
            }
            const aiByDocente = new Map();
            for (const rec of cmtAiAll) {
                if (!rec.docente) continue;
                const ex = aiByDocente.get(rec.docente) || { fortalezas: new Set(), debilidades: new Set(), conclusion_gen: null };
                if (rec.conclusion_gen && !ex.conclusion_gen) ex.conclusion_gen = rec.conclusion_gen;
                parseJsonSafe(rec.fortaleza, []).forEach(f => { if (f) ex.fortalezas.add(f); });
                parseJsonSafe(rec.debilidad, []).forEach(d => { if (d) ex.debilidades.add(d); });
                aiByDocente.set(rec.docente, ex);
            }
            const docentesConAI = conPuntaje.map(d => ({
                ...d,
                ai_analisis: (() => {
                    const ai = aiByDocente.get(d.docente);
                    return ai ? { conclusion_gen: ai.conclusion_gen, fortalezas: Array.from(ai.fortalezas), debilidades: Array.from(ai.debilidades), tiene_analisis: true }
                        : { fortalezas: [], debilidades: [], conclusion_gen: null, tiene_analisis: false };
                })()
            }));

            return {
                sede,
                promedio_sede,
                total_docentes: docentes.length,
                total_programas: programas.length,
                programas,
                mejores_docentes: [...docentesConAI].sort((a, b) => (b.promedio_general || 0) - (a.promedio_general || 0)).slice(0, 3),
                docentes_con_mejora: [...docentesConAI].sort((a, b) => (a.promedio_general || 0) - (b.promedio_general || 0)).slice(0, 3)
            };
        })
    );

    // Aspectos globales
    const aspectoData = await repo.getDocenteAspectMetrics(query);

    // Top/bottom global
    const allDocentesResult = await repo.getAllDocentesStats(
        { ...query, page: 1, limit: 300 },
        {},
        { sortBy: 'promedio_general', sortOrder: 'desc' }
    );
    const allDocentes = (allDocentesResult.data || []).filter(d => d.promedio_general != null);

    return {
        sedes: sedesData,
        total_programas: globalSummary.programas.length,
        total_docentes: allDocentes.length,
        aspectos: aspectoData,
        mejores_docentes_institucional: allDocentes.slice(0, 5),
        docentes_con_mejora_institucional: [...allDocentes].sort((a, b) => (a.promedio_general || 0) - (b.promedio_general || 0)).slice(0, 5)
    };
}

module.exports = {
    evaluationSummary,
    evaluationSummaryByProgram,
    docenteStats,
    ranking,
    docenteAspectMetrics,
    docenteMateriaMetrics,
    docenteMateriaCompletion,
    docenteComments,
    docenteCommentsAnalysis,
    generateDocxReport,
    getReportePrograma,
    getReporteConsolidado,
    getReporteInstitucional,
};
