/**
 * Servicio de Métricas para Evaluaciones
 * Proporciona endpoints para análisis de datos de evaluaciones docentes
 */

import { httpClient } from '../../core/HttpClient';
import { configuracionEvaluacionService } from '../app/cfg-t.service';
import type { ConfiguracionTipo } from '../app/cfg-t.service';

// ========================
// TYPES
// ========================

export interface MetricFilters {
  cfg_t: number;
  sede?: string;
  periodo?: string;
  programa?: string;
  semestre?: string;
  grupo?: string;
}

export interface DocenteMetricFilters extends MetricFilters {
  codigo_materia?: string;
}

// Summary Types
export interface SummaryMetrics {
  generales: {
    total_evaluaciones: number;
    total_realizadas: number;
    total_evaluaciones_registradas: number;
    total_pendientes: number;
    total_estudiantes: number;
    total_estudiantes_registrados: number;
    total_estudiantes_pendientes: number;
    total_docentes: number;
    total_docentes_pendientes: number;
  };
}

export interface ProgramaMetrics {
  total_evaluaciones: number;
  total_evaluaciones_registradas: number;
  total_realizadas: number;
  total_pendientes: number;
  total_estudiantes: number;
  total_estudiantes_registrados: number;
  total_estudiantes_pendientes: number;
  total_docentes: number;
  total_docentes_pendientes: number;
}

export interface GrupoMetrics {
  grupo: string;
  metricas: ProgramaMetrics;
}

export interface ProgramaSummary {
  nombre: string;
  metricas: ProgramaMetrics;
  grupos: GrupoMetrics[];
  selected?: boolean;
}

export interface SummaryByPrograms {
  programas: ProgramaSummary[];
}

// Ranking Types
export interface RankingItem {
  docente: string;
  nombre_docente: string | null;
  total_evaluaciones: number;
  total_realizadas: number;
  total_pendientes: number;
  total_evaluaciones_registradas: number;
  total_estudiantes_registrados: number;
  porcentaje_cumplimiento: number;
  score_rank: number;
  promedio_docente: number;
  promedio_evaluacion: number;
  adjusted: number;
  universo: number;
  desviacion_estandar: number | null;
  eval?: DocenteEvalMetrics;
  // Campos legacy usados por normalizacion local (encuesta/UI)
  avg?: number;
  realizados?: number;
  factores?: {
    v: number;
    m: number;
    global_avg: number;
    participacion_promedio: number;
    factor_participacion: number;
    factor_confianza: number;
  };
  calculo?: {
    promedio_docente: {
      suma_puntajes: number;
      total_respuestas: number;
      formula: string;
    };
    adjusted: {
      formula: string;
    };
    score_rank: {
      formula: string;
    };
  };
  sin_respuestas?: boolean;
}

export interface RankingResponse {
  ranking: RankingItem[];
  meta?: {
    m: number;
    global_avg: number;
    participacion_promedio: number;
    total_docentes: number;
    docentes_con_respuestas: number;
    docentes_sin_respuestas: number;
  };
}

// Docente Metrics Types
export interface DocenteEvalMetrics {
  total_respuestas: number | null;
  total_cmt: number | null;
  total_cmt_gen: number | null;
  suma_cmt: number | null;
  nota_final_ponderada: number | null;
}

export interface DocenteGeneralMetrics {
  docente: string;
  nombre_docente?: string | null;
  promedio_general: number | null;
  desviacion_general: number | null;
  total_evaluaciones: number;
  total_realizadas: number;
  total_pendientes: number;
  total_evaluaciones_registradas?: number;
  total_estudiantes_registrados?: number;
  total_aspectos: number;
  porcentaje_cumplimiento: number;
  suma: number;
  nota_final_ponderada?: number | null;
  eval?: DocenteEvalMetrics;
}

export interface AspectoMetric {
  aspecto_id: number;
  nombre: string | null;
  total_respuestas: number;
  suma: number;
  promedio?: number | null;
  desviacion?: number | null;
}

export interface AspectoGroupMetrics {
  peso: number;
  suma_total: number;
  total_respuestas: number;
  promedio_general: number | null;
  total_cmt?: number;
  total_cmt_gen?: number;
  suma_cmt?: number;
  ponderado: number | null;
  desviacion?: number | null;
  aspectos: AspectoMetric[];
}

export interface ResultadoFinalMetrics {
  nota_final_ponderada: number | null;
}

export interface DocenteAspectosMetrics {
  docente: string | string[];
  codigo_materia?: string | null;
  escala_maxima: number;
  evaluacion_estudiantes: AspectoGroupMetrics;
  autoevaluacion_docente?: AspectoGroupMetrics;
  resultado_final?: ResultadoFinalMetrics;
  aspectos?: AspectoMetric[];
  promedio?: number | null;
  desviacion?: number | null;
  total_respuestas?: number;
  suma_total?: number;
  nota_general?: number | null;
  nota_final_encuesta?: number | null;
}

export interface MateriaGrupoMetric {
  grupo: string;
  total_evaluaciones: number;
  total_realizadas: number;
  total_pendientes: number;
  suma?: number;
  promedio_general?: number | null;
  desviacion_general?: number | null;
  total_evaluaciones_registradas: number;
  total_estudiantes_registrados: number;
  total_aspectos?: number;
  porcentaje_cumplimiento: number;
  nota_final_ponderada?: number | null;
  eval?: DocenteEvalMetrics;
}

export interface MateriaMetric {
  codigo_materia: string;
  nombre_materia: string;
  nom_programa: string;
  semestre: string;
  total_evaluaciones: number;
  total_realizadas: number;
  total_pendientes: number;
  suma?: number;
  promedio_general?: number | null;
  desviacion_general?: number | null;
  total_evaluaciones_registradas: number;
  total_estudiantes_registrados: number;
  total_aspectos?: number;
  porcentaje_cumplimiento: number;
  nota_final_ponderada?: number | null;
  eval?: DocenteEvalMetrics;
  grupo?: string;
  grupos?: MateriaGrupoMetric[];
}

export interface DocenteMateriasMetrics {
  docente: string;
  nombre_docente?: string;
  materias: MateriaMetric[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface DocenteListResponse {
  data: DocenteGeneralMetrics[];
  pagination: PaginationInfo;
}

export interface StudentInfo {
  id: string;
  nombre: string;
}

export interface GrupoCompletion {
  grupo: string;
  completados: StudentInfo[];
  pendientes: StudentInfo[];
}

export interface MateriaCompletionMetrics {
  docente: string;
  nombre_docente?: string;
  codigo_materia: string;
  grupos: GrupoCompletion[];
}

// AI Analysis Types
export interface AspectoAnalysis {
  aspecto: string;
  conclusion: string;
}

export interface AIAnalysis {
  conclusion_general: string;
  aspectos: AspectoAnalysis[];
  fortalezas: string[];
  debilidades: string[];
}

export interface CommentsAnalysisResponse {
  success?: boolean;
  message?: string;
  docente: string;
  total_respuestas?: number;
  analisis?: AIAnalysis;
  materias_analizadas?: string[];
  resultados?: Array<{
    codigo_materia: string;
    estado: 'analizado' | 'sin_respuestas' | 'sin_comentarios';
    analisis?: unknown;
  }>;
}

// ========================
// SERVICE
// ========================

type MetricRoute = 'evaluations' | 'encuesta';

const metricRouteCache = new Map<number, MetricRoute>();
const metricRouteInflight = new Map<number, Promise<MetricRoute>>();

const getNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const buildMetricParams = (
  filters: MetricFilters & {
    docente?: string;
    codigo_materia?: string;
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    usuario?: string;
    include_eval?: boolean;
  }
): URLSearchParams => {
  const params = new URLSearchParams();
  params.append('cfg_t', filters.cfg_t.toString());

  if (filters.docente) params.append('docente', filters.docente);
  if (filters.usuario) params.append('usuario', filters.usuario);
  if (filters.codigo_materia) params.append('codigo_materia', filters.codigo_materia);
  if (filters.search) params.append('search', filters.search);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  if (filters.sede) params.append('sede', filters.sede);
  if (filters.periodo) params.append('periodo', filters.periodo);
  if (filters.programa) params.append('programa', filters.programa);
  if (filters.semestre) params.append('semestre', filters.semestre);
  if (filters.grupo) params.append('grupo', filters.grupo);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (typeof filters.include_eval === 'boolean') params.append('include_eval', String(filters.include_eval));

  return params;
};

const extractConfig = (response: unknown): ConfiguracionTipo | null => {
  if (!response || typeof response !== 'object') return null;

  const direct = response as ConfiguracionTipo;
  if (typeof direct.id === 'number') return direct;

  const one = (response as { data?: unknown }).data;
  if (one && typeof one === 'object' && typeof (one as ConfiguracionTipo).id === 'number') {
    return one as ConfiguracionTipo;
  }

  const two = (one as { data?: unknown } | undefined)?.data;
  if (two && typeof two === 'object' && typeof (two as ConfiguracionTipo).id === 'number') {
    return two as ConfiguracionTipo;
  }

  return null;
};

const resolveMetricRoute = async (cfgT: number): Promise<MetricRoute> => {
  if (metricRouteCache.has(cfgT)) {
    return metricRouteCache.get(cfgT)!;
  }

  if (metricRouteInflight.has(cfgT)) {
    return metricRouteInflight.get(cfgT)!;
  }

  const resolver = (async () => {
    try {
      const response = await configuracionEvaluacionService.getById(cfgT);
      const cfg = extractConfig(response);
      const tipoFormId = cfg?.tipo_form?.id ?? cfg?.tipo_form_id ?? 1;
      const route: MetricRoute = tipoFormId === 2 ? 'encuesta' : 'evaluations';
      metricRouteCache.set(cfgT, route);
      return route;
    } catch {
      metricRouteCache.set(cfgT, 'evaluations');
      return 'evaluations';
    } finally {
      metricRouteInflight.delete(cfgT);
    }
  })();

  metricRouteInflight.set(cfgT, resolver);
  return resolver;
};

const normalizeEncuestaSummary = (payload: any): SummaryMetrics => {
  const generales = payload?.generales || {};
  const totalEncuestas = getNumber(generales.total_encuestas, 0);
  const totalRealizadas = getNumber(generales.total_realizadas, 0);
  const totalPendientes = getNumber(generales.total_pendientes, Math.max(totalEncuestas - totalRealizadas, 0));

  return {
    generales: {
      total_evaluaciones: totalEncuestas,
      total_realizadas: totalRealizadas,
      total_evaluaciones_registradas: totalEncuestas,
      total_pendientes: totalPendientes,
      total_estudiantes: 0,
      total_estudiantes_registrados: 0,
      total_estudiantes_pendientes: 0,
      total_docentes: 0,
      total_docentes_pendientes: 0,
    },
  };
};

const normalizeEncuestaProgramas = (payload: any): SummaryByPrograms => {
  const programas = Array.isArray(payload?.programas) ? payload.programas : [];
  return {
    programas: programas.map((programa: any) => {
      const totalEvaluaciones = getNumber(programa?.metricas?.total_encuestas, 0);
      const totalRealizadas = getNumber(programa?.metricas?.total_realizadas, 0);
      const totalPendientes = getNumber(programa?.metricas?.total_pendientes, Math.max(totalEvaluaciones - totalRealizadas, 0));

      return {
        nombre: programa?.nombre || 'SIN_PROGRAMA',
        selected: Boolean(programa?.selected),
        metricas: {
          total_evaluaciones: totalEvaluaciones,
          total_evaluaciones_registradas: totalEvaluaciones,
          total_realizadas: totalRealizadas,
          total_pendientes: totalPendientes,
          total_estudiantes: 0,
          total_estudiantes_registrados: 0,
          total_estudiantes_pendientes: 0,
          total_docentes: 0,
          total_docentes_pendientes: 0,
        },
        grupos: (Array.isArray(programa?.grupos) ? programa.grupos : []).map((grupo: any) => {
          const grupoTotal = getNumber(grupo?.metricas?.total_encuestas, 0);
          const grupoRealizadas = getNumber(grupo?.metricas?.total_realizadas, 0);
          const grupoPendientes = getNumber(grupo?.metricas?.total_pendientes, Math.max(grupoTotal - grupoRealizadas, 0));

          return {
            grupo: grupo?.grupo || 'SIN_GRUPO',
            metricas: {
              total_evaluaciones: grupoTotal,
              total_evaluaciones_registradas: grupoTotal,
              total_realizadas: grupoRealizadas,
              total_pendientes: grupoPendientes,
              total_estudiantes: 0,
              total_estudiantes_registrados: 0,
              total_estudiantes_pendientes: 0,
              total_docentes: 0,
              total_docentes_pendientes: 0,
            },
          };
        }),
      };
    }),
  };
};

const normalizeDocenteList = (payload: any): DocenteListResponse => {
  const rawData = Array.isArray(payload?.data)
    ? payload.data
    : payload && typeof payload === 'object' && (payload.docente || payload.usuario)
      ? [payload]
      : [];

  const data: DocenteGeneralMetrics[] = rawData.map((item: any) => {
    const totalEvaluaciones = getNumber(item?.total_evaluaciones ?? item?.total_encuestas, 0);
    const totalRealizadas = getNumber(item?.total_realizadas, 0);
    const totalPendientes = getNumber(item?.total_pendientes, Math.max(totalEvaluaciones - totalRealizadas, 0));
    const porcentaje = totalEvaluaciones > 0
      ? Number(((totalRealizadas * 100) / totalEvaluaciones).toFixed(2))
      : 0;

    return {
      docente: String(item?.docente ?? item?.usuario ?? ''),
      nombre_docente: item?.nombre_docente ?? null,
      promedio_general: item?.promedio_general ?? null,
      desviacion_general: item?.desviacion_general ?? null,
      total_evaluaciones: totalEvaluaciones,
      total_realizadas: totalRealizadas,
      total_pendientes: totalPendientes,
      total_evaluaciones_registradas: getNumber(item?.total_evaluaciones_registradas, totalEvaluaciones),
      total_estudiantes_registrados: getNumber(item?.total_estudiantes_registrados, 0),
      total_aspectos: getNumber(item?.total_aspectos, 0),
      porcentaje_cumplimiento: getNumber(item?.porcentaje_cumplimiento, porcentaje),
      suma: getNumber(item?.suma ?? item?.suma_total, 0),
    };
  });

  return {
    data,
    pagination: {
      page: getNumber(payload?.pagination?.page, 1),
      limit: getNumber(payload?.pagination?.limit, data.length || 1),
      total: getNumber(payload?.pagination?.total, data.length),
      pages: getNumber(payload?.pagination?.pages, 1),
    },
  };
};

const getEncuestaDocentesPage = async (
  filters: MetricFilters & {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<any> => {
  const params = buildMetricParams(filters);
  return httpClient.get<any>(`/metric/encuesta/docentes?${params.toString()}`);
};

const findEncuestaDocenteRaw = async (
  docenteId: string,
  filters: MetricFilters & {
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
  }
): Promise<any | null> => {
  const limit = Math.min(filters.limit ?? 100, 100);
  const firstPage = await getEncuestaDocentesPage({ ...filters, page: 1, limit });

  const firstData = Array.isArray(firstPage?.data) ? firstPage.data : [];
  const foundInFirst = firstData.find((item: any) => String(item?.docente) === docenteId);
  if (foundInFirst) return foundInFirst;

  const totalPages = getNumber(firstPage?.pagination?.pages, 1);
  for (let page = 2; page <= totalPages; page += 1) {
    const response = await getEncuestaDocentesPage({ ...filters, page, limit });
    const data = Array.isArray(response?.data) ? response.data : [];
    const found = data.find((item: any) => String(item?.docente) === docenteId);
    if (found) return found;
  }

  return null;
};

const normalizeEncuestaAspectos = (payload: any, docente?: string, codigoMateria?: string): DocenteAspectosMetrics => {
  const aspectos: AspectoMetric[] = Array.isArray(payload?.aspectos)
    ? payload.aspectos.map((a: any) => ({
        aspecto_id: getNumber(a?.aspecto_id, 0),
        nombre: a?.nombre ?? null,
        total_respuestas: getNumber(a?.total_respuestas, 0),
        suma: getNumber(a?.suma, 0),
        promedio: a?.promedio ?? null,
        desviacion: null,
      }))
    : [];

  const totalRespuestas = getNumber(payload?.total_respuestas, 0);
  const sumaTotal = getNumber(payload?.suma_total, 0);
  const notaGeneral = payload?.nota_general ?? null;
  const notaFinal = payload?.nota_final_encuesta ?? notaGeneral;

  return {
    docente: docente || 'AGREGADO',
    codigo_materia: codigoMateria ?? null,
    escala_maxima: 5,
    evaluacion_estudiantes: {
      peso: 1,
      suma_total: sumaTotal,
      total_respuestas: totalRespuestas,
      promedio_general: notaGeneral,
      ponderado: notaGeneral,
      desviacion: null,
      aspectos,
    },
    autoevaluacion_docente: {
      peso: 0,
      suma_total: 0,
      total_respuestas: 0,
      promedio_general: null,
      ponderado: null,
      desviacion: null,
      aspectos: [],
    },
    resultado_final: {
      nota_final_ponderada: notaFinal,
    },
    aspectos,
    promedio: notaGeneral,
    desviacion: null,
    total_respuestas: totalRespuestas,
    suma_total: sumaTotal,
    nota_general: notaGeneral,
    nota_final_encuesta: notaFinal,
  };
};

export const metricService = {
  getMetricRouteByCfgT: async (cfgT: number): Promise<'evaluations' | 'encuesta'> => {
    return resolveMetricRoute(cfgT);
  },

  isEncuestaCfgT: async (cfgT: number): Promise<boolean> => {
    return (await resolveMetricRoute(cfgT)) === 'encuesta';
  },

  /**
   * Obtener resumen general de métricas de evaluaciones
   */
  getSummary: async (filters: MetricFilters): Promise<SummaryMetrics> => {
    const params = buildMetricParams(filters);
    const route = await resolveMetricRoute(filters.cfg_t);

    if (route === 'encuesta') {
      const response = await httpClient.get<any>(`/metric/encuesta/summary?${params.toString()}`);
      return normalizeEncuestaSummary(response);
    }

    return httpClient.get<SummaryMetrics>(`/metric/evaluations/summary?${params.toString()}`);
  },

  /**
   * Obtener métricas agrupadas por programas y grupos
   */
  getSummaryByPrograms: async (filters: MetricFilters): Promise<SummaryByPrograms> => {
    const params = buildMetricParams(filters);
    const route = await resolveMetricRoute(filters.cfg_t);

    if (route === 'encuesta') {
      const response = await httpClient.get<any>(`/metric/encuesta/summary/programas?${params.toString()}`);
      return normalizeEncuestaProgramas(response);
    }

    return httpClient.get<SummaryByPrograms>(`/metric/evaluations/summary/programas?${params.toString()}`);
  },

  /**
   * Obtener listado de docentes con métricas (paginado)
   */
  getDocentes: async (
    filters: MetricFilters & {
      docente?: string;
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      include_eval?: boolean;
    }
  ): Promise<DocenteListResponse> => {
    const params = buildMetricParams(filters);
    const route = await resolveMetricRoute(filters.cfg_t);

    if (route === 'encuesta') {
      if (filters.docente) {
        const found = await findEncuestaDocenteRaw(String(filters.docente), {
          ...filters,
          limit: 100,
        });

        if (!found) {
          return {
            data: [],
            pagination: {
              page: 1,
              limit: 1,
              total: 0,
              pages: 1,
            },
          };
        }

        return normalizeDocenteList({
          data: [found],
          pagination: {
            page: 1,
            limit: 1,
            total: 1,
            pages: 1,
          },
        });
      }

      const response = await httpClient.get<any>(`/metric/encuesta/docentes?${params.toString()}`);
      return normalizeDocenteList(response);
    }

    const response = await httpClient.get<any>(`/metric/evaluations/docentes?${params.toString()}`);
    return normalizeDocenteList(response);
  },

  /**
   * Obtener ranking de docentes con ajuste bayesiano
   */
  getRanking: async (filters: MetricFilters): Promise<RankingResponse> => {
    const params = buildMetricParams(filters);
    const route = await resolveMetricRoute(filters.cfg_t);

    if (route === 'encuesta') {
      const docentes = await metricService.getDocentes({
        ...filters,
        page: 1,
        limit: 100,
        sortBy: 'total_realizadas',
        sortOrder: 'desc',
      });

      return {
        ranking: (docentes.data || []).map((docente) => ({
          docente: docente.docente,
          nombre_docente: docente.nombre_docente || docente.docente,
          total_evaluaciones: docente.total_evaluaciones,
          total_realizadas: docente.total_realizadas,
          total_pendientes: docente.total_pendientes,
          total_evaluaciones_registradas: docente.total_evaluaciones_registradas ?? docente.total_realizadas,
          total_estudiantes_registrados: docente.total_estudiantes_registrados ?? docente.total_realizadas,
          porcentaje_cumplimiento: docente.porcentaje_cumplimiento,
          score_rank: Number(docente.promedio_general ?? 0),
          promedio_docente: Number(docente.promedio_general ?? 0),
          promedio_evaluacion: Number(docente.promedio_general ?? 0),
          avg: Number(docente.promedio_general ?? 0),
          adjusted: Number(docente.promedio_general ?? 0),
          realizados: docente.total_realizadas,
          universo: docente.total_evaluaciones,
          desviacion_estandar: docente.desviacion_general,
          eval: docente.eval,
        })),
      };
    }

    return httpClient.get<RankingResponse>(`/metric/evaluations/ranking?${params.toString()}`);
  },

  /**
   * Obtener métricas generales de un docente
   */
  getDocenteMetrics: async (docente: string, filters: MetricFilters): Promise<DocenteGeneralMetrics> => {
    const list = await metricService.getDocentes({ ...filters, docente, page: 1, limit: 1 });
    if (Array.isArray(list?.data) && list.data.length > 0) {
      return list.data[0];
    }

    throw new Error('No se encontraron métricas del docente');
  },

  /**
   * Obtener métricas por aspecto de un docente
   * Si se proporciona codigo_materia, filtra solo a esa materia
   */
  getDocenteAspectos: async (
    filters: DocenteMetricFilters & { docente?: string }
  ): Promise<DocenteAspectosMetrics> => {
    const route = await resolveMetricRoute(filters.cfg_t);

    if (route === 'encuesta') {
      const params = buildMetricParams({
        ...filters,
        usuario: filters.docente,
      });
      const response = await httpClient.get<any>(`/metric/encuesta/aspectos?${params.toString()}`);
      return normalizeEncuestaAspectos(response, filters.docente, filters.codigo_materia);
    }

    const params = buildMetricParams(filters);
    return httpClient.get<DocenteAspectosMetrics>(`/metric/evaluations/docentes/aspectos?${params.toString()}`);
  },

  /**
   * Obtener métricas por materia de un docente
   * Si se proporciona codigo_materia, filtra solo esa materia
   */
  getDocenteMaterias: async (docente: string, filters: DocenteMetricFilters): Promise<DocenteMateriasMetrics> => {
    const route = await resolveMetricRoute(filters.cfg_t);

    if (route === 'encuesta') {
      const docenteRaw = await findEncuestaDocenteRaw(String(docente), {
        ...filters,
        limit: 1,
      });

      const materiasRaw = Array.isArray(docenteRaw?.materias) ? docenteRaw.materias : [];
      const materias: MateriaMetric[] = (Array.isArray(materiasRaw) ? materiasRaw : []).map((materia: any) => {
        const totalEvaluaciones = getNumber(materia?.total_evaluaciones ?? materia?.total_encuestas, 0);
        const totalRealizadas = getNumber(materia?.total_realizadas, 0);
        const totalPendientes = getNumber(materia?.total_pendientes, Math.max(totalEvaluaciones - totalRealizadas, 0));

        return {
          codigo_materia: String(materia?.codigo_materia ?? ''),
          nombre_materia: materia?.nombre_materia ?? '',
          nom_programa: materia?.nom_programa ?? '',
          semestre: materia?.semestre ?? '',
          total_evaluaciones: totalEvaluaciones,
          total_realizadas: totalRealizadas,
          total_pendientes: totalPendientes,
          suma: getNumber(materia?.suma ?? materia?.suma_total, 0),
          promedio_general: materia?.promedio_general ?? null,
          desviacion_general: materia?.desviacion_general ?? null,
          total_evaluaciones_registradas: getNumber(materia?.total_evaluaciones_registradas, totalEvaluaciones),
          total_estudiantes_registrados: getNumber(materia?.total_estudiantes_registrados, totalEvaluaciones),
          total_aspectos: getNumber(materia?.total_aspectos, 0),
          porcentaje_cumplimiento: getNumber(
            materia?.porcentaje_cumplimiento,
            totalEvaluaciones > 0 ? Number(((totalRealizadas * 100) / totalEvaluaciones).toFixed(2)) : 0
          ),
          grupos: Array.isArray(materia?.grupos) ? materia.grupos : [],
        };
      });

      return {
        docente,
        nombre_docente: docenteRaw?.nombre_docente,
        materias,
      };
    }

    const params = buildMetricParams(filters);
    return httpClient.get<DocenteMateriasMetrics>(`/metric/evaluations/docente/${docente}/materias?${params.toString()}`);
  },

  /**
   * Obtener estado de completitud de evaluaciones por materia
   * Lista de estudiantes que completaron vs pendientes, agrupados por GRUPO
   */
  getMateriaCompletion: async (
    docente: string,
    codigoMateria: string,
    filters: MetricFilters
  ): Promise<MateriaCompletionMetrics> => {
    const params = buildMetricParams(filters);
    const route = await resolveMetricRoute(filters.cfg_t);

    const endpoint = route === 'encuesta'
      ? `/metric/encuesta/docente/${docente}/materias/${codigoMateria}/completion?${params.toString()}`
      : `/metric/evaluations/docente/${docente}/materias/${codigoMateria}/completion?${params.toString()}`;

    return httpClient.get<MateriaCompletionMetrics>(endpoint);
  },

  /**
   * Analizar comentarios con IA y actualizar conclusiones en la BD
   * Si se especifica codigo_materia, solo analiza esa materia.
   * Si no, analiza TODAS las materias por separado.
   */
  analyzeComments: async (docente: string, filters: DocenteMetricFilters): Promise<CommentsAnalysisResponse> => {
    const params = new URLSearchParams();
    params.append('cfg_t', filters.cfg_t.toString());
    
    if (filters.codigo_materia) params.append('codigo_materia', filters.codigo_materia);
    if (filters.sede) params.append('sede', filters.sede);
    if (filters.periodo) params.append('periodo', filters.periodo);
    if (filters.programa) params.append('programa', filters.programa);
    if (filters.semestre) params.append('semestre', filters.semestre);
    if (filters.grupo) params.append('grupo', filters.grupo);

    return httpClient.get<CommentsAnalysisResponse>(
      `/metric/evaluations/docente/${docente}/comments/analysis?${params.toString()}`
    );
  },

  /**
   * Generar y descargar reporte DOCX del docente
   * Retorna un Blob que se puede usar para descargar el archivo
   */
  downloadDocenteReport: async (docente: string, filters: DocenteMetricFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    params.append('cfg_t', filters.cfg_t.toString());
    
    if (filters.codigo_materia) params.append('codigo_materia', filters.codigo_materia);
    if (filters.sede) params.append('sede', filters.sede);
    if (filters.periodo) params.append('periodo', filters.periodo);
    if (filters.programa) params.append('programa', filters.programa);
    if (filters.semestre) params.append('semestre', filters.semestre);
    if (filters.grupo) params.append('grupo', filters.grupo);

    const response = await fetch(
      `${httpClient['baseURL']}/metric/evaluations/docente/${docente}/report.docx?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': httpClient['defaultHeaders']['Authorization'] || '',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error al generar reporte: ${response.statusText}`);
    }

    return response.blob();
  },

  /**
   * Reporte por programa: todos los docentes con métricas + AI cacheado + rankings
   */
  getReportePrograma: async (filters: MetricFilters): Promise<ReporteProgramaResponse> => {
    const params = buildMetricParams(filters);
    const response = await httpClient.get(`/metric/evaluations/reporte/programa?${params.toString()}`);
    return (response as { data?: ReporteProgramaResponse }).data ?? (response as ReporteProgramaResponse);
  },

  /**
   * Reporte consolidado: programas agrupados por sede con top/bottom docentes
   */
  getReporteConsolidado: async (filters: MetricFilters): Promise<ReporteConsolidadoResponse> => {
    const params = buildMetricParams(filters);
    const response = await httpClient.get(`/metric/evaluations/reporte/consolidado?${params.toString()}`);
    return (response as { data?: ReporteConsolidadoResponse }).data ?? (response as ReporteConsolidadoResponse);
  },

  /**
   * Reporte institucional: todas las sedes con métricas + rankings globales
   */
  getReporteInstitucional: async (filters: MetricFilters): Promise<ReporteInstitucionalResponse> => {
    const params = buildMetricParams(filters);
    const response = await httpClient.get(`/metric/evaluations/reporte/institucional?${params.toString()}`);
    return (response as { data?: ReporteInstitucionalResponse }).data ?? (response as ReporteInstitucionalResponse);
  },

  /**
   * Helper: Descargar reporte DOCX automáticamente
   */
  downloadDocenteReportToFile: async (
    docente: string,
    filters: DocenteMetricFilters,
    filename?: string
  ): Promise<void> => {
    const blob = await metricService.downloadDocenteReport(docente, filters);
    
    // Crear elemento <a> temporal para descargar
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `reporte_docente_${docente}_${Date.now()}.docx`;
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// ========================
// REPORT TYPES
// ========================

export interface DocenteConAI extends DocenteGeneralMetrics {
  ai_analisis: {
    conclusion_gen: string | null;
    fortalezas: string[];
    debilidades: string[];
    tiene_analisis: boolean;
  };
}

export interface ReporteProgramaResponse {
  programa: string;
  total_docentes: number;
  docentes: DocenteConAI[];
  aspectos: DocenteAspectosMetrics;
  rankings: {
    mejores_docentes: DocenteConAI[];
    docentes_con_mejora: DocenteConAI[];
  };
}

export interface ProgramaConDocentes extends ProgramaSummary {
  promedio_programa: number | null;
  total_docentes: number;
  docentes: DocenteConAI[];
  mejores_docentes: DocenteConAI[];
  docentes_con_mejora: DocenteConAI[];
}

export interface ReporteConsolidadoResponse {
  sede: string;
  programas: ProgramaConDocentes[];
}

export interface SedeData {
  sede: string;
  promedio_sede: number | null;
  total_docentes: number;
  total_programas: number;
  programas: ProgramaSummary[];
  mejores_docentes: DocenteConAI[];
  docentes_con_mejora: DocenteConAI[];
}

export interface ReporteInstitucionalResponse {
  sedes: SedeData[];
  total_programas: number;
  total_docentes: number;
  aspectos: DocenteAspectosMetrics;
  mejores_docentes_institucional: DocenteGeneralMetrics[];
  docentes_con_mejora_institucional: DocenteGeneralMetrics[];
}

// ========================
// EXPORTS
// ========================

export default metricService;
