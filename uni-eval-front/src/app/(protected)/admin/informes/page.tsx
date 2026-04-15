"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Search,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Settings2,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  BarChart3,
  BookOpen,
  X,
} from "lucide-react";
import Filtros from "@/src/app/(protected)/admin/components/filters";
import { metricService } from "@/src/api/services/metric/metric.service";
import type {
  DocenteGeneralMetrics,
  DocenteAspectosMetrics,
  DocenteMateriasMetrics,
  MetricFilters,
} from "@/src/api/services/metric/metric.service";
import type { FiltrosState } from "../types";

const FiltersMemo = memo(Filtros);

// ============================================================================
// Helpers
// ============================================================================

const getScoreColor = (score: number | null | undefined) => {
  if (score == null) return "text-slate-300";
  if (score >= 4.5) return "text-emerald-600";
  if (score >= 4.0) return "text-blue-600";
  if (score >= 3.0) return "text-amber-600";
  return "text-rose-600";
};

const getScoreBg = (score: number | null | undefined) => {
  if (score == null) return "bg-slate-50 text-slate-400 border-slate-100";
  if (score >= 4.5) return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (score >= 4.0) return "bg-blue-50 text-blue-700 border-blue-100";
  if (score >= 3.0) return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-rose-50 text-rose-700 border-rose-100";
};

const getStatusConfig = (docente: DocenteGeneralMetrics) => {
  if (docente.total_pendientes === 0 && docente.total_realizadas > 0) {
    return { label: "Completado", color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CheckCircle2 };
  }
  if (docente.total_realizadas > 0) {
    return { label: "En Progreso", color: "bg-blue-50 text-blue-700 border-blue-100", icon: Clock };
  }
  return { label: "Pendiente", color: "bg-slate-50 text-slate-600 border-slate-100", icon: AlertCircle };
};

// ============================================================================
// Panel detalle del docente
// ============================================================================

interface DocenteDetailPanelProps {
  docente: DocenteGeneralMetrics;
  filtros: FiltrosState;
  onClose: () => void;
}

function DocenteDetailPanel({ docente, filtros, onClose }: DocenteDetailPanelProps) {
  const [aspectos, setAspectos] = useState<DocenteAspectosMetrics | null>(null);
  const [materias, setMaterias] = useState<DocenteMateriasMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"aspectos" | "materias">("aspectos");

  useEffect(() => {
    const cargar = async () => {
      if (!filtros.configuracionSeleccionada) return;
      try {
        setLoading(true);
        const filters: MetricFilters = {
          cfg_t: filtros.configuracionSeleccionada,
          docente: docente.docente,
          sede: filtros.sedeSeleccionada || undefined,
          periodo: filtros.periodoSeleccionado || undefined,
          programa: filtros.programaSeleccionado || undefined,
          semestre: filtros.semestreSeleccionado || undefined,
          grupo: filtros.grupoSeleccionado || undefined,
        } as MetricFilters & { docente: string };

        const [asp, mat] = await Promise.all([
          metricService.getDocenteAspectos({ ...filters }),
          metricService.getDocenteMaterias(docente.docente, filters),
        ]);
        setAspectos(asp);
        setMaterias(mat);
      } catch {
        // silencio — datos no disponibles
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [docente.docente, filtros]);

  const compliance = docente.porcentaje_cumplimiento || 0;

  return (
    <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      {/* Header del panel */}
      <div className="flex items-center gap-4 p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center font-black text-xl text-indigo-600 flex-shrink-0">
          {docente.nombre_docente?.charAt(0) || "D"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 truncate">{docente.nombre_docente || "Sin nombre"}</p>
          <p className="text-[10px] font-mono text-slate-400">ID: {docente.docente}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className={`text-2xl font-black italic ${getScoreColor(docente.promedio_general)}`}>
              {docente.promedio_general ? docente.promedio_general.toFixed(2) : "—"}
            </p>
            <p className="text-[10px] text-slate-400">{compliance.toFixed(0)}% cumplimiento</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab("aspectos")}
          className={`flex-1 py-3 text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
            activeTab === "aspectos"
              ? "text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50/30"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Por Aspecto
        </button>
        <button
          onClick={() => setActiveTab("materias")}
          className={`flex-1 py-3 text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
            activeTab === "materias"
              ? "text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50/30"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Por Materia
        </button>
      </div>

      {/* Contenido */}
      <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <Skeleton className="h-6 w-12 rounded-lg" />
              </div>
            ))}
          </div>
        ) : activeTab === "aspectos" ? (
          <div className="space-y-2.5">
            {aspectos?.evaluacion_estudiantes?.aspectos?.length ? (
              aspectos.evaluacion_estudiantes.aspectos.map((asp) => {
                const prom = asp.promedio ?? (asp.total_respuestas > 0 ? asp.suma / asp.total_respuestas : null);
                const pct = prom ? (prom / (aspectos.escala_maxima || 5)) * 100 : 0;
                return (
                  <div key={asp.aspecto_id} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-800 leading-tight pr-4">
                        {asp.nombre || `Aspecto ${asp.aspecto_id}`}
                      </p>
                      <Badge
                        variant="outline"
                        className={`rounded-lg border text-xs px-2 py-0.5 flex-shrink-0 font-bold ${getScoreBg(prom)}`}
                      >
                        {prom ? prom.toFixed(2) : "—"}
                      </Badge>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          (prom ?? 0) >= 4.5
                            ? "bg-emerald-500"
                            : (prom ?? 0) >= 4.0
                            ? "bg-blue-500"
                            : (prom ?? 0) >= 3.0
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {asp.total_respuestas} respuestas
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center">
                <BarChart3 className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-xs text-slate-400">Sin datos de aspectos disponibles.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {materias?.materias?.length ? (
              materias.materias.map((mat) => {
                const compliance = mat.porcentaje_cumplimiento || 0;
                return (
                  <div key={mat.codigo_materia} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 leading-snug">
                          {mat.nombre_materia}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {mat.codigo_materia} · {mat.nom_programa}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`rounded-lg border text-xs px-2 py-0.5 flex-shrink-0 font-bold ${getScoreBg(mat.promedio_general)}`}
                      >
                        {mat.promedio_general ? mat.promedio_general.toFixed(2) : "—"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            compliance === 100 ? "bg-emerald-500" : compliance > 50 ? "bg-indigo-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${compliance}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-700 w-8 text-right flex-shrink-0">
                        {compliance.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {mat.total_realizadas}/{mat.total_evaluaciones} evaluaciones · sem. {mat.semestre}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center">
                <BookOpen className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-xs text-slate-400">Sin materias registradas.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Página principal
// ============================================================================

export default function InformesPage() {
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
    limit: 10,
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
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Informes</h1>
              <p className="text-xs font-medium text-muted-foreground">Reportes de evaluaciones docentes</p>
            </div>
          </div>
          {filtros.configuracionSeleccionada && (
            <Badge variant="outline" className="h-8 px-4 rounded-full border-slate-200 text-slate-500 font-medium text-xs bg-white shadow-sm">
              <Users className="w-3.5 h-3.5 mr-2 text-emerald-500" />
              {pagination.total} Docentes
            </Badge>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1680px] px-6 py-10 lg:px-8 xl:px-10 space-y-8">
        {/* Filtros */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-1000" />
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
              Seleccione un modelo de evaluación para visualizar los informes de docentes.
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Barra de búsqueda */}
            <div className="flex items-center gap-3 px-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-medium text-muted-foreground">Desempeño por Docente</h3>
            </div>

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
              <Input
                placeholder="Buscar por nombre o identificación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
                className="pl-11 h-12 bg-white border-slate-200 focus:border-slate-300 rounded-2xl transition-all duration-300 font-medium max-w-lg"
              />
            </div>

            {/* Tabla de docentes */}
            <div className="relative bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/30">
                      <th className="px-6 py-5 text-xs font-medium text-muted-foreground w-[30%] min-w-[240px]">Docente</th>
                      <th className="px-6 py-5 text-xs font-medium text-muted-foreground">Estado</th>
                      <th className="px-6 py-5 text-xs font-medium text-muted-foreground text-center">Evaluaciones</th>
                      <th className="px-6 py-5 text-xs font-medium text-muted-foreground">Cumplimiento</th>
                      <th className="px-6 py-5 text-xs font-medium text-muted-foreground text-center">Calificación</th>
                      <th className="px-6 py-5 text-xs font-medium text-muted-foreground text-right">Informe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      [...Array(10)].map((_, i) => (
                        <tr key={i} className="border-b border-slate-50">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <Skeleton className="h-11 w-11 rounded-xl flex-shrink-0" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5"><Skeleton className="h-6 w-24 rounded-full" /></td>
                          <td className="px-6 py-5"><Skeleton className="h-4 w-16 mx-auto" /></td>
                          <td className="px-6 py-5"><Skeleton className="h-2 w-28 rounded-full" /></td>
                          <td className="px-6 py-5"><Skeleton className="h-8 w-12 rounded-lg mx-auto" /></td>
                          <td className="px-6 py-5 text-right"><Skeleton className="h-10 w-28 rounded-2xl ml-auto" /></td>
                        </tr>
                      ))
                    ) : docentes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-28 text-center">
                          <div className="flex flex-col items-center max-w-xs mx-auto">
                            <div className="p-8 rounded-[2.5rem] bg-slate-50 mb-5 border border-slate-100 shadow-inner">
                              <Users className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1 italic">Sin resultados</h3>
                            <p className="text-xs font-semibold text-slate-400">
                              No se encontraron docentes con los filtros actuales.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      docentes.map((docente) => {
                        const status = getStatusConfig(docente);
                        const StatusIcon = status.icon;
                        const compliance = docente.porcentaje_cumplimiento || 0;
                        const isSelected = selectedDocente?.docente === docente.docente;

                        return (
                          <tr
                            key={docente.docente}
                            className={`group transition-colors duration-200 border-b border-slate-50 last:border-0 ${
                              isSelected ? "bg-emerald-50/40" : "hover:bg-slate-50/50"
                            }`}
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center font-black text-emerald-600 group-hover:scale-105 transition-transform duration-300 shadow-sm flex-shrink-0">
                                  {docente.nombre_docente?.charAt(0) || "D"}
                                  {compliance === 100 && (
                                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-lg shadow-emerald-200">
                                      <Award className="w-2.5 h-2.5" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 group-hover:text-emerald-900 transition-colors text-sm truncate max-w-[200px]">
                                    {docente.nombre_docente || "Sin nombre"}
                                  </p>
                                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                    ID: {docente.docente}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <Badge
                                variant="outline"
                                className={`rounded-full border px-2.5 py-1 font-medium text-xs flex items-center w-fit gap-1.5 ${status.color}`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </Badge>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-sm font-black text-slate-700">
                                  {docente.total_realizadas}
                                  <span className="text-xs font-normal text-slate-300">
                                    /{docente.total_evaluaciones}
                                  </span>
                                </span>
                                <div className="flex gap-0.5 mt-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className={`h-1 w-2.5 rounded-full ${
                                        (i / 5) * 100 < compliance
                                          ? "bg-emerald-400"
                                          : "bg-slate-100"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="w-32">
                                <div className="flex justify-between items-center mb-1 px-0.5">
                                  <span className="text-[10px] font-black text-slate-900 italic">{compliance.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50">
                                  <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                      compliance === 100 ? "bg-emerald-500" : compliance > 50 ? "bg-emerald-400" : "bg-amber-400"
                                    }`}
                                    style={{ width: `${compliance}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <div className="flex flex-col items-center hover:scale-110 transition-transform cursor-help">
                                <span className={`text-2xl font-black italic tracking-tighter ${getScoreColor(docente.promedio_general)}`}>
                                  {docente.promedio_general ? docente.promedio_general.toFixed(2) : "—"}
                                </span>
                                <div className="h-1 w-8 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-1000 ${getScoreColor(docente.promedio_general).replace("text-", "bg-")}`}
                                    style={{ width: `${(docente.promedio_general || 0) * 20}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setSelectedDocente(isSelected ? null : docente)
                                }
                                className={`rounded-2xl border-2 transition-all duration-300 h-10 px-5 shadow-sm active:scale-95 text-xs font-medium gap-2 ${
                                  isSelected
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "border-slate-100 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                                }`}
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                                {isSelected ? "Cerrar" : "Ver informe"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 rounded-3xl border border-slate-100">
                <p className="text-xs font-medium text-muted-foreground hidden md:block">
                  Mostrando {docentes.length} de {pagination.total} registros
                </p>
                <div className="flex items-center gap-2 mx-auto md:mx-0">
                  {renderPaginationButtons()}
                </div>
              </div>
            )}

            {/* Panel detalle del docente seleccionado */}
            {selectedDocente && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 px-1 mb-4">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Informe Detallado · {selectedDocente.nombre_docente || selectedDocente.docente}
                  </h3>
                </div>
                <DocenteDetailPanel
                  docente={selectedDocente}
                  filtros={filtros}
                  onClose={() => setSelectedDocente(null)}
                />
              </div>
            )}
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
