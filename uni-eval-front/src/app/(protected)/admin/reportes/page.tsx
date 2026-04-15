"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  FileText,
  Search,
  Users,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Brain,
  AlertCircle,
  CheckCircle2,
  Clock,
  Award,
  FileDown,
} from "lucide-react";
import Filtros from "@/src/app/(protected)/admin/components/filters";
import { metricService } from "@/src/api/services/metric/metric.service";
import type {
  DocenteGeneralMetrics,
  DocenteAspectosMetrics,
  CommentsAnalysisResponse,
  MetricFilters,
} from "@/src/api/services/metric/metric.service";
import type { FiltrosState } from "../types";

const FiltersMemo = memo(Filtros);

// ============================================================================
// Helpers
// ============================================================================

const getScoreColor = (score: number | null) => {
  if (!score) return "text-slate-300";
  if (score >= 4.5) return "text-emerald-600";
  if (score >= 4.0) return "text-blue-600";
  if (score >= 3.0) return "text-amber-600";
  return "text-rose-600";
};

const getStatusConfig = (docente: DocenteGeneralMetrics) => {
  if (docente.total_pendientes === 0 && docente.total_realizadas > 0) {
    return {
      label: "Completado",
      color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    };
  }
  if (docente.total_realizadas > 0) {
    return {
      label: "En Progreso",
      color: "bg-blue-50 text-blue-700 border-blue-100",
    };
  }
  return {
    label: "Pendiente",
    color: "bg-slate-50 text-slate-600 border-slate-100",
  };
};

// ============================================================================
// Panel de análisis IA
// ============================================================================

interface AIAnalysisPanelProps {
  docente: DocenteGeneralMetrics;
  filtros: FiltrosState;
}

function AIAnalysisPanel({ docente, filtros }: AIAnalysisPanelProps) {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<CommentsAnalysisResponse | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingDocx, setLoadingDocx] = useState(false);

  const handleAnalyzeAI = async () => {
    if (!filtros.configuracionSeleccionada) return;
    try {
      setLoadingAI(true);
      const result = await metricService.analyzeComments(docente.docente, {
        cfg_t: filtros.configuracionSeleccionada,
        sede: filtros.sedeSeleccionada || undefined,
        periodo: filtros.periodoSeleccionado || undefined,
        programa: filtros.programaSeleccionado || undefined,
        semestre: filtros.semestreSeleccionado || undefined,
        grupo: filtros.grupoSeleccionado || undefined,
      });
      setAnalysis(result);
      toast({ title: "Análisis completado", description: "La IA procesó los comentarios del docente." });
    } catch {
      toast({
        title: "Error en análisis IA",
        description: "No se pudo conectar con el proveedor de IA.",
        variant: "destructive",
      });
    } finally {
      setLoadingAI(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!filtros.configuracionSeleccionada) return;
    try {
      setLoadingDocx(true);
      await metricService.downloadDocenteReportToFile(
        docente.docente,
        {
          cfg_t: filtros.configuracionSeleccionada,
          sede: filtros.sedeSeleccionada || undefined,
          periodo: filtros.periodoSeleccionado || undefined,
          programa: filtros.programaSeleccionado || undefined,
          semestre: filtros.semestreSeleccionado || undefined,
          grupo: filtros.grupoSeleccionado || undefined,
        },
        `reporte_${docente.nombre_docente || docente.docente}.docx`
      );
      toast({ title: "Reporte descargado", description: "El archivo DOCX fue generado exitosamente." });
    } catch {
      toast({
        title: "Error al descargar",
        description: "No se pudo generar el reporte DOCX.",
        variant: "destructive",
      });
    } finally {
      setLoadingDocx(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del docente seleccionado */}
      <div className="flex items-center gap-5 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[2rem] border border-blue-100">
        <div className="w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-indigo-100 to-blue-100 border border-indigo-200 flex items-center justify-center font-black text-2xl text-indigo-600 shadow-sm flex-shrink-0">
          {docente.nombre_docente?.charAt(0) || "D"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-lg leading-tight">
            {docente.nombre_docente || "Sin nombre"}
          </p>
          <p className="text-xs font-mono text-slate-500 mt-1">ID: {docente.docente}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xl font-black italic ${getScoreColor(docente.promedio_general)}`}>
              {docente.promedio_general ? docente.promedio_general.toFixed(2) : "—"}
            </span>
            <span className="text-xs text-slate-400">promedio general</span>
            <div className="h-3 w-px bg-slate-200" />
            <span className="text-xs text-slate-500">
              {docente.total_realizadas}/{docente.total_evaluaciones} evaluaciones
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button
            onClick={handleDownloadDocx}
            disabled={loadingDocx}
            className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-medium text-sm shadow-sm gap-2 transition-all"
          >
            {loadingDocx ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            {loadingDocx ? "Generando..." : "Descargar DOCX"}
          </Button>
          <Button
            onClick={handleAnalyzeAI}
            disabled={loadingAI}
            variant="outline"
            className="h-10 px-5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-2xl font-medium text-sm gap-2 transition-all"
          >
            {loadingAI ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
            {loadingAI ? "Analizando..." : "Análisis IA"}
          </Button>
        </div>
      </div>

      {/* Resultado del análisis IA */}
      {loadingAI && (
        <div className="space-y-3 p-6 bg-white rounded-[2rem] border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <p className="text-sm font-medium text-slate-500">Procesando comentarios con IA...</p>
          </div>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className={`h-4 rounded-full ${i === 3 ? "w-2/3" : "w-full"}`} />
          ))}
        </div>
      )}

      {analysis && !loadingAI && (
        <div className="space-y-4 animate-in fade-in duration-500">
          {/* Conclusión general */}
          {analysis.analisis?.conclusion_general && (
            <div className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-indigo-500" />
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Conclusión General
                </p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {analysis.analisis.conclusion_general}
              </p>
            </div>
          )}

          {/* Fortalezas y debilidades */}
          {(analysis.analisis?.fortalezas?.length || analysis.analisis?.debilidades?.length) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.analisis?.fortalezas?.length ? (
                <div className="p-5 bg-emerald-50/50 rounded-[2rem] border border-emerald-100">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                      Fortalezas
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {analysis.analisis.fortalezas.map((f, i) => (
                      <li key={i} className="text-sm text-slate-700 flex gap-2">
                        <span className="text-emerald-400 mt-0.5 flex-shrink-0">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {analysis.analisis?.debilidades?.length ? (
                <div className="p-5 bg-amber-50/50 rounded-[2rem] border border-amber-100">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                      Áreas de Mejora
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {analysis.analisis.debilidades.map((d, i) => (
                      <li key={i} className="text-sm text-slate-700 flex gap-2">
                        <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Análisis por aspecto */}
          {analysis.analisis?.aspectos?.length ? (
            <div className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">
                Análisis por Aspecto
              </p>
              <div className="space-y-3">
                {analysis.analisis.aspectos.map((asp, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs font-semibold text-slate-800 mb-1">{asp.aspecto}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{asp.conclusion}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Materias analizadas */}
          {analysis.materias_analizadas?.length ? (
            <div className="flex flex-wrap gap-2">
              {analysis.materias_analizadas.map((m, i) => (
                <Badge key={i} variant="outline" className="rounded-full border-slate-200 text-xs text-slate-600">
                  {m}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Página principal
// ============================================================================

export default function ReportesPage() {
  const { toast } = useToast();

  const [filtros, setFiltros] = useState<FiltrosState>({
    configuracionSeleccionada: null,
    semestreSeleccionado: "",
    periodoSeleccionado: "",
    programaSeleccionado: "",
    grupoSeleccionado: "",
    sedeSeleccionada: "",
  });

  const [docentes, setDocentes] = useState<DocenteGeneralMetrics[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocente, setSelectedDocente] = useState<DocenteGeneralMetrics | null>(null);

  const metricFilters: MetricFilters = {
    cfg_t: filtros.configuracionSeleccionada || 0,
    ...(filtros.sedeSeleccionada && { sede: filtros.sedeSeleccionada }),
    ...(filtros.periodoSeleccionado && { periodo: filtros.periodoSeleccionado }),
    ...(filtros.programaSeleccionado && { programa: filtros.programaSeleccionado }),
    ...(filtros.semestreSeleccionado && { semestre: filtros.semestreSeleccionado }),
    ...(filtros.grupoSeleccionado && { grupo: filtros.grupoSeleccionado }),
  };

  const cargarDocentes = useCallback(
    async (page = 1, search = "") => {
      if (!filtros.configuracionSeleccionada) {
        setDocentes([]);
        return;
      }
      try {
        setLoading(true);
        const result = await metricService.getDocentes({
          ...metricFilters,
          page,
          limit: pagination.limit,
          search: search || undefined,
          sortBy: "promedio_general",
          sortOrder: "desc",
        });
        setDocentes(result.data || []);
        setPagination((prev) => ({ ...prev, page, ...result.pagination }));
        setSelectedDocente(null);
      } catch {
        toast({
          title: "Error cargando docentes",
          description: "No se pudo obtener el listado.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtros, pagination.limit]
  );

  useEffect(() => {
    cargarDocentes(1, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filtros.configuracionSeleccionada,
    filtros.sedeSeleccionada,
    filtros.periodoSeleccionado,
    filtros.programaSeleccionado,
    filtros.semestreSeleccionado,
    filtros.grupoSeleccionado,
  ]);

  // Debounce búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filtros.configuracionSeleccionada) {
        cargarDocentes(1, searchTerm);
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleFiltrosChange = useCallback((nuevosFiltros: FiltrosState) => {
    setFiltros(nuevosFiltros);
  }, []);

  const handleLimpiarFiltros = useCallback(() => {
    setFiltros((prev) => ({
      ...prev,
      semestreSeleccionado: "",
      periodoSeleccionado: "",
      programaSeleccionado: "",
      grupoSeleccionado: "",
      sedeSeleccionada: "",
    }));
  }, []);

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.pages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    buttons.push(
      <Button
        key="prev"
        variant="ghost"
        size="icon"
        onClick={() => cargarDocentes(pagination.page - 1, searchTerm)}
        disabled={loading || pagination.page === 1}
        className="rounded-xl hover:bg-slate-100 disabled:opacity-30"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
    );

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={`page-btn-${i}`}
          variant={pagination.page === i ? "default" : "ghost"}
          size="sm"
          onClick={() => cargarDocentes(i, searchTerm)}
          disabled={loading}
          className={`h-9 w-9 rounded-xl font-bold transition-all duration-200 ${
            pagination.page === i
              ? "bg-slate-900 text-white shadow-lg"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {i}
        </Button>
      );
    }

    buttons.push(
      <Button
        key="next"
        variant="ghost"
        size="icon"
        onClick={() => cargarDocentes(pagination.page + 1, searchTerm)}
        disabled={loading || pagination.page === pagination.pages}
        className="rounded-xl hover:bg-slate-100 disabled:opacity-30"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    );

    return buttons;
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 border-b border-slate-100 shadow-sm backdrop-blur-xl">
        <div className="mx-auto h-20 w-full max-w-[1680px] px-6 lg:px-8 xl:px-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
              <Download className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reportes</h1>
              <p className="text-xs font-medium text-muted-foreground">Análisis avanzado con IA · Exportación DOCX</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1680px] px-6 py-10 lg:px-8 xl:px-10 space-y-8">
        {/* Filtros */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-1000" />
          <div className="relative">
            <FiltersMemo
              filtros={filtros}
              onFiltrosChange={handleFiltrosChange}
              onLimpiarFiltros={handleLimpiarFiltros}
              loading={loading}
            />
          </div>
        </div>

        {!filtros.configuracionSeleccionada ? (
          <div className="bg-slate-50/50 border border-slate-100 rounded-[3rem] p-16 shadow-inner text-center max-w-2xl mx-auto my-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="h-24 w-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-sm">
              <Settings2 className="h-12 w-12 text-slate-200" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 italic tracking-tight">
              Configuración Necesaria
            </h2>
            <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-sm mx-auto">
              Seleccione un modelo de evaluación para generar reportes y análisis por docente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_480px] gap-8 items-start animate-in fade-in duration-700">
            {/* Panel izquierdo: lista de docentes */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 px-1">
                <FileText className="h-4 w-4 text-indigo-600" />
                <h3 className="text-xs font-medium text-muted-foreground">
                  Seleccionar Docente para Reporte
                </h3>
              </div>

              {/* Buscador */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input
                  placeholder="Buscar por nombre o identificación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                  className="pl-11 h-12 bg-white border-slate-200 focus:border-slate-300 rounded-2xl transition-all duration-300 font-medium"
                />
              </div>

              {/* Lista de docentes */}
              <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="divide-y divide-slate-50">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-6 py-4">
                        <Skeleton className="h-11 w-11 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : docentes.length === 0 ? (
                  <div className="py-24 text-center">
                    <div className="p-8 rounded-[2.5rem] bg-slate-50 w-fit mx-auto mb-4 border border-slate-100">
                      <Users className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-lg font-black text-slate-900 italic">Sin resultados</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No se encontraron docentes con los filtros actuales.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {docentes.map((doc) => {
                      const status = getStatusConfig(doc);
                      const isSelected = selectedDocente?.docente === doc.docente;
                      return (
                        <button
                          key={doc.docente}
                          onClick={() => setSelectedDocente(isSelected ? null : doc)}
                          className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-all duration-200 group ${
                            isSelected
                              ? "bg-indigo-50/80 border-l-4 border-l-indigo-500"
                              : "hover:bg-slate-50/70 border-l-4 border-l-transparent"
                          }`}
                        >
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                              isSelected
                                ? "bg-gradient-to-br from-indigo-100 to-blue-100 border border-indigo-200 text-indigo-600"
                                : "bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 text-slate-600"
                            }`}
                          >
                            {doc.nombre_docente?.charAt(0) || "D"}
                            {doc.porcentaje_cumplimiento === 100 && (
                              <Award className="absolute -top-1 -right-1 w-3 h-3 text-emerald-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-bold text-sm truncate ${
                                isSelected ? "text-indigo-900" : "text-slate-900"
                              }`}
                            >
                              {doc.nombre_docente || "Sin nombre"}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                              ID: {doc.docente}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`rounded-full border text-[10px] px-2 py-0.5 flex-shrink-0 ${status.color}`}
                          >
                            {status.label}
                          </Badge>
                          <span
                            className={`text-base font-black italic flex-shrink-0 w-10 text-right ${getScoreColor(
                              doc.promedio_general
                            )}`}
                          >
                            {doc.promedio_general ? doc.promedio_general.toFixed(1) : "—"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Paginación */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 rounded-3xl border border-slate-100">
                  <p className="text-xs font-medium text-muted-foreground hidden sm:block">
                    {pagination.total} docentes · página {pagination.page}/{pagination.pages}
                  </p>
                  <div className="flex items-center gap-1 mx-auto sm:mx-0">
                    {renderPaginationButtons()}
                  </div>
                </div>
              )}
            </div>

            {/* Panel derecho: análisis del docente seleccionado */}
            <div className="space-y-5 xl:sticky xl:top-24">
              <div className="flex items-center gap-3 px-1">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <h3 className="text-xs font-medium text-muted-foreground">
                  Análisis y Exportación
                </h3>
              </div>

              {selectedDocente ? (
                <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm p-6">
                  <AIAnalysisPanel docente={selectedDocente} filtros={filtros} />
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm p-10 text-center">
                  <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                    <FileText className="h-8 w-8 text-indigo-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    Selecciona un docente
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Elige un docente de la lista para generar su reporte DOCX o iniciar el análisis con IA.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e2e8f0; }
      `}</style>
    </div>
  );
}
