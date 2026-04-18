"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Globe,
  MapPin,
  BarChart3,
  RefreshCw,
  GraduationCap,
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
  ReporteInstitucionalResponse,
  SedeData,
  DocenteConAI,
  DocenteGeneralMetrics,
  MetricFilters,
} from "@/src/api/services/metric/metric.service";

// ─── helpers ─────────────────────────────────────────────────────────────────

const scoreColor = (v: number | null | undefined) => {
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

const SEDE_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308"];

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
      <p className="text-xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-700 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── DocenteRankRow ───────────────────────────────────────────────────────────

function DocenteRankRow({
  doc,
  rank,
  tipo,
}: {
  doc: DocenteGeneralMetrics;
  rank: number;
  tipo: "top" | "mejora";
}) {
  const [open, setOpen] = useState(false);
  const ai = (doc as DocenteConAI).ai_analisis;
  const items = tipo === "top" ? ai?.fortalezas : ai?.debilidades;
  const hasAI = ai?.tiene_analisis;

  return (
    <div className="bg-white/70 rounded-xl overflow-hidden">
      <button
        onClick={() => items?.length ? setOpen((o) => !o) : undefined}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/90 transition-colors"
      >
        <span
          className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center flex-shrink-0 ${
            tipo === "top" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-900 truncate">{doc.nombre_docente ?? "Sin nombre"}</p>
          {items?.[0] && (
            <p className="text-[10px] text-slate-500 truncate mt-0.5">{items[0]}</p>
          )}
        </div>
        {hasAI && (
          <Brain className="w-3 h-3 text-indigo-400 flex-shrink-0" />
        )}
        <span className={`text-sm font-black italic flex-shrink-0 ${scoreColor(doc.promedio_general)}`}>
          {doc.promedio_general?.toFixed(2) ?? "—"}
        </span>
        {items && items.length > 0 && (open ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />)}
      </button>
      {open && items && items.length > 0 && (
        <div className={`px-4 pb-3 ${tipo === "top" ? "bg-emerald-50/40" : "bg-amber-50/40"}`}>
          <ul className="space-y-1">
            {items.map((item, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-slate-700">
                <span className={`mt-0.5 flex-shrink-0 ${tipo === "top" ? "text-emerald-400" : "text-amber-400"}`}>•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── SedePanel ────────────────────────────────────────────────────────────────

function SedePanel({ sede, color }: { sede: SedeData; color: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
        >
          <MapPin className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 truncate">{sede.sede}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {sede.total_programas} programas · {sede.total_docentes} docentes
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className={`text-base font-black italic ${scoreColor(sede.promedio_sede)}`}>
              {sede.promedio_sede?.toFixed(2) ?? "—"}
            </p>
            <p className="text-[9px] text-slate-400">promedio</p>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-50 space-y-4 pt-4">
          {/* Top/mejora por sede */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wide">Mejores en esta sede</p>
              </div>
              <div className="space-y-1.5">
                {sede.mejores_docentes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-2">Sin datos</p>
                ) : (
                  sede.mejores_docentes.map((d, i) => (
                    <div key={`${d.docente}-${i}`} className="flex items-center gap-2 bg-white/60 rounded-lg px-2.5 py-1.5">
                      <span className="text-[9px] font-bold text-emerald-600 w-3">{i + 1}</span>
                      <p className="text-[10px] font-medium text-slate-800 flex-1 truncate">{d.nombre_docente ?? "Sin nombre"}</p>
                      <span className={`text-[11px] font-bold ${scoreColor(d.promedio_general)}`}>{d.promedio_general?.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown className="w-3 h-3 text-amber-600" />
                <p className="text-[9px] font-semibold text-amber-700 uppercase tracking-wide">Con aspectos de mejora</p>
              </div>
              <div className="space-y-1.5">
                {sede.docentes_con_mejora.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-2">Sin datos</p>
                ) : (
                  sede.docentes_con_mejora.map((d, i) => (
                    <div key={`${d.docente}-${i}`} className="flex items-center gap-2 bg-white/60 rounded-lg px-2.5 py-1.5">
                      <span className="text-[9px] font-bold text-amber-600 w-3">{i + 1}</span>
                      <p className="text-[10px] font-medium text-slate-800 flex-1 truncate">{d.nombre_docente ?? "Sin nombre"}</p>
                      <span className={`text-[11px] font-bold ${scoreColor(d.promedio_general)}`}>{d.promedio_general?.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Programas de la sede */}
          {sede.programas.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Programas</p>
              <div className="flex flex-wrap gap-2">
                {sede.programas.map((prog) => (
                  <Badge key={prog.nombre} variant="outline" className="rounded-full text-[10px] border-slate-200 text-slate-600 px-3">
                    {prog.nombre}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────

function SedesChart({ sedes }: { sedes: SedeData[] }) {
  const data = sedes
    .filter((s) => s.promedio_sede != null)
    .map((s, i) => ({
      name: s.sede.length > 20 ? s.sede.slice(0, 20) + "…" : s.sede,
      fullName: s.sede,
      promedio: s.promedio_sede ?? 0,
      color: SEDE_COLORS[i % SEDE_COLORS.length],
    }));

  if (!data.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-4 h-4 text-indigo-500" />
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Promedio General por Sede</p>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 48)}>
        <BarChart layout="vertical" data={data} margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, "auto"]} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(val) => [Number(val).toFixed(2), "Promedio"]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""}
          />
          <Bar dataKey="promedio" radius={[0, 6, 6, 0]} maxBarSize={32}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AspectosChart({ aspectos }: { aspectos: ReporteInstitucionalResponse["aspectos"] }) {
  const list =
    aspectos?.evaluacion_estudiantes?.aspectos ??
    aspectos?.aspectos ??
    [];

  if (!list.length) return null;

  const data = list
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
        <BarChart3 className="w-4 h-4 text-violet-500" />
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Promedio por Aspecto — Institucional</p>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 42)}>
        <BarChart layout="vertical" data={data} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, "auto"]} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(val) => [Number(val).toFixed(2), "Promedio"]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""}
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

export default function ReporteInstitucional({ filters }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<ReporteInstitucionalResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    if (!filters.cfg_t) return;
    try {
      setLoading(true);
      const result = await metricService.getReporteInstitucional(filters);
      setData(result);
    } catch {
      toast({ title: "Error cargando reporte institucional", description: "No se pudo obtener el reporte.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.cfg_t, filters.periodo]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    );
  }

  if (!data) return null;

  const promedioInstitucional = data.mejores_docentes_institucional.length
    ? Number((
        data.mejores_docentes_institucional.reduce((s, d) => s + (d.promedio_general ?? 0), 0) /
        data.mejores_docentes_institucional.length
      ).toFixed(2))
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
            <Globe className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Reporte Institucional</p>
            <p className="text-xs text-slate-500">
              {data.sedes.length} sedes · {data.total_programas} programas · {data.total_docentes} docentes
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={cargar} className="rounded-xl gap-2 text-slate-500">
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </Button>
      </div>

      {/* KPIs institucionales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Sedes" value={data.sedes.length} />
        <MetricCard label="Programas" value={data.total_programas} />
        <MetricCard label="Docentes" value={data.total_docentes} />
        <MetricCard
          label="Promedio Institucional"
          value={promedioInstitucional?.toFixed(2) ?? "—"}
          sub="top docentes"
        />
      </div>

      {/* Gráfica por sedes */}
      <SedesChart sedes={data.sedes} />

      {/* Gráfica por aspectos institucional */}
      <AspectosChart aspectos={data.aspectos} />

      {/* Rankings institucionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Mejores Docentes Institucionalmente
            </p>
          </div>
          <div className="space-y-2">
            {data.mejores_docentes_institucional.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Sin datos disponibles</p>
            ) : (
              data.mejores_docentes_institucional.map((doc, i) => (
                <DocenteRankRow
                  key={`top-${doc.docente}-${i}`}
                  doc={doc}
                  rank={i + 1}
                  tipo="top"
                />
              ))
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-amber-600" />
            <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Con Más Aspectos de Mejora
            </p>
          </div>
          <div className="space-y-2">
            {data.docentes_con_mejora_institucional.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Sin datos disponibles</p>
            ) : (
              data.docentes_con_mejora_institucional.map((doc, i) => (
                <DocenteRankRow
                  key={`mejora-${doc.docente}-${i}`}
                  doc={doc}
                  rank={i + 1}
                  tipo="mejora"
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sedes detalladas */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-500" />
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Detalle por Sede ({data.sedes.length})
          </p>
        </div>
        <div className="space-y-3">
          {data.sedes.map((sede, i) => (
            <SedePanel key={sede.sede} sede={sede} color={SEDE_COLORS[i % SEDE_COLORS.length]} />
          ))}
        </div>
      </div>
    </div>
  );
}
