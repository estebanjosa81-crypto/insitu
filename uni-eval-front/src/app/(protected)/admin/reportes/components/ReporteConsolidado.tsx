"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Building2,
  GraduationCap,
  BarChart3,
  RefreshCw,
  Users,
  Brain,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { metricService } from "@/src/api/services/metric/metric.service";
import type {
  ReporteConsolidadoResponse,
  ProgramaConDocentes,
  DocenteConAI,
  MetricFilters,
} from "@/src/api/services/metric/metric.service";

// ─── helpers ─────────────────────────────────────────────────────────────────

const scoreColor = (v: number | null) => {
  if (!v) return "text-slate-300";
  if (v >= 4.5) return "text-emerald-600";
  if (v >= 4.0) return "text-blue-600";
  if (v >= 3.0) return "text-amber-600";
  return "text-rose-600";
};

const barColor = (v: number) => {
  if (v >= 4.5) return "#10b981";
  if (v >= 4.0) return "#3b82f6";
  if (v >= 3.0) return "#f59e0b";
  return "#ef4444";
};

// ─── DocenteMiniCard ─────────────────────────────────────────────────────────

function DocenteMiniCard({ doc, tipo }: { doc: DocenteConAI; tipo: "top" | "mejora" }) {
  const items = tipo === "top" ? doc.ai_analisis?.fortalezas : doc.ai_analisis?.debilidades;
  const hasBullet = items && items.length > 0;

  return (
    <div className="flex items-start gap-3 bg-white/70 rounded-xl px-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-600 flex-shrink-0">
        {doc.nombre_docente?.charAt(0) ?? "D"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-900 truncate">{doc.nombre_docente ?? "Sin nombre"}</p>
        {hasBullet && (
          <p className="text-[10px] text-slate-500 leading-snug mt-0.5 line-clamp-2">{items![0]}</p>
        )}
      </div>
      <span className={`text-sm font-black italic flex-shrink-0 ${scoreColor(doc.promedio_general)}`}>
        {doc.promedio_general?.toFixed(2) ?? "—"}
      </span>
    </div>
  );
}

// ─── ProgramaPanel ────────────────────────────────────────────────────────────

function ProgramaPanel({ prog }: { prog: ProgramaConDocentes }) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const visibleDocentes = showAll ? prog.docentes : prog.docentes.slice(0, 4);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 truncate">{prog.nombre}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{prog.total_docentes} docentes</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className={`text-base font-black italic ${scoreColor(prog.promedio_programa)}`}>
              {prog.promedio_programa?.toFixed(2) ?? "—"}
            </p>
            <p className="text-[9px] text-slate-400">promedio</p>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-50 space-y-5 pt-4">
          {/* Métricas generales */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Evaluaciones", val: prog.metricas.total_evaluaciones.toString() },
              { label: "Realizadas", val: prog.metricas.total_realizadas.toString() },
              { label: "Pendientes", val: prog.metricas.total_pendientes.toString() },
              { label: "Estudiantes", val: prog.metricas.total_estudiantes.toString() },
            ].map((s) => (
              <div key={s.label} className="bg-slate-50 rounded-xl px-2 py-2 text-center">
                <p className="text-xs font-bold text-slate-800">{s.val}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Rankings por programa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">Mejores Docentes</p>
              </div>
              <div className="space-y-2">
                {prog.mejores_docentes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-2">Sin datos</p>
                ) : (
                  prog.mejores_docentes.map((d) => <DocenteMiniCard key={d.docente} doc={d} tipo="top" />)
                )}
              </div>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Con Aspectos de Mejora</p>
              </div>
              <div className="space-y-2">
                {prog.docentes_con_mejora.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-2">Sin datos</p>
                ) : (
                  prog.docentes_con_mejora.map((d) => <DocenteMiniCard key={d.docente} doc={d} tipo="mejora" />)
                )}
              </div>
            </div>
          </div>

          {/* Lista de docentes */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Docentes del programa
            </p>
            <div className="space-y-2">
              {visibleDocentes.map((doc) => (
                <div key={doc.docente} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2">
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-600 flex-shrink-0">
                    {doc.nombre_docente?.charAt(0) ?? "D"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{doc.nombre_docente ?? "Sin nombre"}</p>
                  </div>
                  {doc.ai_analisis?.tiene_analisis && (
                    <Brain className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                  )}
                  <span className={`text-xs font-bold flex-shrink-0 ${scoreColor(doc.promedio_general)}`}>
                    {doc.promedio_general?.toFixed(2) ?? "—"}
                  </span>
                </div>
              ))}
            </div>
            {prog.docentes.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll((p) => !p)}
                className="w-full mt-2 rounded-xl text-xs text-slate-500 border border-slate-100"
              >
                {showAll ? "Ver menos" : `Ver ${prog.docentes.length - 4} más`}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ProgramasChart ───────────────────────────────────────────────────────────

function ProgramasChart({ programas }: { programas: ProgramaConDocentes[] }) {
  const data = programas
    .filter((p) => p.promedio_programa != null)
    .map((p) => ({
      name: p.nombre.length > 28 ? p.nombre.slice(0, 28) + "…" : p.nombre,
      fullName: p.nombre,
      promedio: p.promedio_programa ?? 0,
      docentes: p.total_docentes,
    }));

  if (!data.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-4 h-4 text-indigo-500" />
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Promedio por Programa</p>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44)}>
        <BarChart layout="vertical" data={data} margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, "auto"]} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(val, name) => [Number(val).toFixed(2), name === "promedio" ? "Promedio" : "Docentes"]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""}
          />
          <Bar dataKey="promedio" radius={[0, 6, 6, 0]} maxBarSize={30}>
            {data.map((entry, i) => (
              <Cell key={i} fill={barColor(entry.promedio)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  filters: MetricFilters;
}

export default function ReporteConsolidado({ filters }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<ReporteConsolidadoResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    if (!filters.cfg_t) return;
    try {
      setLoading(true);
      const result = await metricService.getReporteConsolidado(filters);
      setData(result);
    } catch {
      toast({ title: "Error cargando reporte consolidado", description: "No se pudo obtener el reporte.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.cfg_t, filters.sede, filters.periodo, filters.semestre]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    );
  }

  if (!data) return null;

  const totalDocentes = data.programas.reduce((s, p) => s + p.total_docentes, 0);
  const promediosValidos = data.programas.filter((p) => p.promedio_programa != null);
  const promedioGlobal = promediosValidos.length
    ? promediosValidos.reduce((s, p) => s + (p.promedio_programa ?? 0), 0) / promediosValidos.length
    : null;

  // Resumen global: mejores y con más mejoras a través de todos los programas
  const allTop = data.programas.flatMap((p) => p.mejores_docentes);
  const allMejora = data.programas.flatMap((p) => p.docentes_con_mejora);
  const globalMejores = [...allTop].sort((a, b) => (b.promedio_general ?? 0) - (a.promedio_general ?? 0)).slice(0, 5);
  const globalMejora = [...allMejora].sort((a, b) => (a.promedio_general ?? 0) - (b.promedio_general ?? 0)).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900">{data.sede}</p>
            <p className="text-xs text-slate-500">
              {data.programas.length} programas · {totalDocentes} docentes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {promedioGlobal != null && (
            <div className="text-right">
              <p className={`text-2xl font-black italic ${scoreColor(promedioGlobal)}`}>
                {promedioGlobal.toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-400">promedio consolidado</p>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={cargar} className="rounded-xl gap-2 text-slate-500">
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Gráfica de programas */}
      <ProgramasChart programas={data.programas} />

      {/* Rankings globales consolidados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Top Docentes Consolidado</p>
          </div>
          <div className="space-y-2">
            {globalMejores.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Sin datos disponibles</p>
            ) : (
              globalMejores.map((doc, i) => (
                <div key={`${doc.docente}-${i}`} className="flex items-start gap-3 bg-white/70 rounded-xl px-3 py-2.5">
                  <span className="w-5 h-5 rounded-md bg-emerald-100 text-[10px] font-black text-emerald-700 flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{doc.nombre_docente ?? "Sin nombre"}</p>
                    {doc.ai_analisis?.fortalezas?.[0] && (
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{doc.ai_analisis.fortalezas[0]}</p>
                    )}
                  </div>
                  <span className={`text-sm font-black italic flex-shrink-0 ${scoreColor(doc.promedio_general)}`}>
                    {doc.promedio_general?.toFixed(2) ?? "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-amber-600" />
            <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Con Más Aspectos de Mejora</p>
          </div>
          <div className="space-y-2">
            {globalMejora.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Sin datos disponibles</p>
            ) : (
              globalMejora.map((doc, i) => (
                <div key={`${doc.docente}-${i}`} className="flex items-start gap-3 bg-white/70 rounded-xl px-3 py-2.5">
                  <span className="w-5 h-5 rounded-md bg-amber-100 text-[10px] font-black text-amber-700 flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{doc.nombre_docente ?? "Sin nombre"}</p>
                    {doc.ai_analisis?.debilidades?.[0] && (
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{doc.ai_analisis.debilidades[0]}</p>
                    )}
                  </div>
                  <span className={`text-sm font-black italic flex-shrink-0 ${scoreColor(doc.promedio_general)}`}>
                    {doc.promedio_general?.toFixed(2) ?? "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Programas detallados */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-slate-500" />
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Detalle por Programa ({data.programas.length})
          </p>
        </div>
        <div className="space-y-3">
          {data.programas.map((prog) => (
            <ProgramaPanel key={prog.nombre} prog={prog} />
          ))}
        </div>
      </div>
    </div>
  );
}
