"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Award,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  BarChart3,
  Brain,
  RefreshCw,
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
  Legend,
} from "recharts";
import { metricService } from "@/src/api/services/metric/metric.service";
import type {
  ReporteProgramaResponse,
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

// ─── DocenteCard ─────────────────────────────────────────────────────────────

function DocenteCard({ doc, rank }: { doc: DocenteConAI; rank?: number }) {
  const [open, setOpen] = useState(false);
  const hasAI = doc.ai_analisis?.tiene_analisis;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        {rank !== undefined && (
          <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 flex-shrink-0">
            {rank}
          </span>
        )}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 flex-shrink-0">
          {doc.nombre_docente?.charAt(0) ?? "D"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 truncate">
            {doc.nombre_docente ?? "Sin nombre"}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">ID: {doc.docente}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {hasAI && (
            <Badge variant="outline" className="text-[9px] border-indigo-200 text-indigo-600 rounded-full px-2">
              <Brain className="w-2.5 h-2.5 mr-1" />
              IA
            </Badge>
          )}
          <span className={`text-lg font-black italic ${scoreColor(doc.promedio_general)}`}>
            {doc.promedio_general?.toFixed(2) ?? "—"}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-50 space-y-4 pt-4 animate-in fade-in duration-200">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Evaluaciones", val: `${doc.total_realizadas}/${doc.total_evaluaciones}` },
              { label: "Cumplimiento", val: `${doc.porcentaje_cumplimiento?.toFixed(0) ?? 0}%` },
              { label: "Promedio", val: doc.promedio_general?.toFixed(2) ?? "—" },
            ].map((s) => (
              <div key={s.label} className="bg-slate-50 rounded-xl px-3 py-2 text-center">
                <p className="text-xs font-bold text-slate-800">{s.val}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* AI Analysis */}
          {hasAI ? (
            <div className="space-y-3">
              {doc.ai_analisis.conclusion_gen && (
                <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Brain className="w-3.5 h-3.5 text-indigo-500" />
                    <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wide">Conclusión IA</p>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{doc.ai_analisis.conclusion_gen}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doc.ai_analisis.fortalezas.length > 0 && (
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">Fortalezas</p>
                    </div>
                    <ul className="space-y-1.5">
                      {doc.ai_analisis.fortalezas.map((f, i) => (
                        <li key={i} className="flex gap-1.5 text-xs text-slate-700">
                          <span className="text-emerald-400 mt-0.5 flex-shrink-0">•</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {doc.ai_analisis.debilidades.length > 0 && (
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Aspectos de Mejora</p>
                    </div>
                    <ul className="space-y-1.5">
                      {doc.ai_analisis.debilidades.map((d, i) => (
                        <li key={i} className="flex gap-1.5 text-xs text-slate-700">
                          <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-2">
              Sin análisis IA — ejecuta el análisis desde la pestaña "Por Docente"
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── RankingSection ───────────────────────────────────────────────────────────

function RankingSection({
  title,
  icon: Icon,
  iconColor,
  bgColor,
  borderColor,
  docentes,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  docentes: DocenteConAI[];
}) {
  return (
    <div className={`rounded-2xl border ${borderColor} ${bgColor} p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">{title}</p>
      </div>
      <div className="space-y-3">
        {docentes.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4">Sin datos disponibles</p>
        ) : (
          docentes.map((doc, i) => (
            <div key={doc.docente} className="flex items-center gap-3 bg-white/70 rounded-xl px-3 py-2.5">
              <span className="w-5 h-5 rounded-md bg-slate-100 text-[10px] font-black text-slate-500 flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{doc.nombre_docente ?? "Sin nombre"}</p>
                {doc.ai_analisis?.debilidades?.length > 0 && (
                  <p className="text-[10px] text-slate-500 truncate mt-0.5" title={doc.ai_analisis.debilidades[0]}>
                    {doc.ai_analisis.debilidades[0]}
                  </p>
                )}
                {doc.ai_analisis?.fortalezas?.length > 0 && (
                  <p className="text-[10px] text-slate-500 truncate mt-0.5" title={doc.ai_analisis.fortalezas[0]}>
                    {doc.ai_analisis.fortalezas[0]}
                  </p>
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
  );
}

// ─── AspectoChart ─────────────────────────────────────────────────────────────

function AspectoChart({ aspectos }: { aspectos: ReporteProgramaResponse["aspectos"] }) {
  const aspectList =
    aspectos?.evaluacion_estudiantes?.aspectos ??
    aspectos?.aspectos ??
    [];

  if (!aspectList.length) return null;

  const data = aspectList
    .filter((a) => a.promedio != null)
    .map((a) => ({
      name: (a.nombre ?? `Asp. ${a.aspecto_id}`).length > 22
        ? (a.nombre ?? `Asp. ${a.aspecto_id}`).slice(0, 22) + "…"
        : (a.nombre ?? `Asp. ${a.aspecto_id}`),
      fullName: a.nombre ?? `Aspecto ${a.aspecto_id}`,
      promedio: Number((a.promedio ?? 0).toFixed(2)),
    }));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-4 h-4 text-indigo-500" />
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Promedio por Aspecto — Programa</p>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
        <BarChart layout="vertical" data={data} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, "auto"]} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(val) => [Number(val).toFixed(2), "Promedio"]}
            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName ?? label}
          />
          <Bar dataKey="promedio" radius={[0, 6, 6, 0]} maxBarSize={28}>
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

export default function ReportePorPrograma({ filters }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<ReporteProgramaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAllDocentes, setShowAllDocentes] = useState(false);

  const cargar = async () => {
    if (!filters.cfg_t) return;
    try {
      setLoading(true);
      const result = await metricService.getReportePrograma(filters);
      setData(result);
    } catch {
      toast({ title: "Error cargando reporte", description: "No se pudo obtener el reporte por programa.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.cfg_t, filters.sede, filters.periodo, filters.programa, filters.semestre, filters.grupo]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const visibleDocentes = showAllDocentes ? data.docentes : data.docentes.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Header del programa */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900">{data.programa}</p>
            <p className="text-xs text-slate-500">{data.total_docentes} docentes en este período</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={cargar} className="rounded-xl gap-2 text-slate-500">
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </Button>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <RankingSection
          title="Docentes Destacados"
          icon={TrendingUp}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50/30"
          borderColor="border-emerald-100"
          docentes={data.rankings.mejores_docentes}
        />
        <RankingSection
          title="Docentes con Aspectos de Mejora"
          icon={TrendingDown}
          iconColor="text-amber-600"
          bgColor="bg-amber-50/30"
          borderColor="border-amber-100"
          docentes={data.rankings.docentes_con_mejora}
        />
      </div>

      {/* Gráfica de aspectos */}
      <AspectoChart aspectos={data.aspectos} />

      {/* Lista completa de docentes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Todos los Docentes ({data.total_docentes})
          </p>
        </div>
        <div className="space-y-3">
          {visibleDocentes.map((doc, i) => (
            <DocenteCard key={doc.docente} doc={doc} rank={i + 1} />
          ))}
        </div>
        {data.docentes.length > 6 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllDocentes((p) => !p)}
            className="w-full rounded-2xl border border-slate-100 text-slate-500 text-xs"
          >
            {showAllDocentes ? "Ver menos" : `Ver ${data.docentes.length - 6} más`}
          </Button>
        )}
      </div>
    </div>
  );
}
