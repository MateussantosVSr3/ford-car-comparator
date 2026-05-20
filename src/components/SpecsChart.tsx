import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EspecificacaoFord } from "@/lib/ford.functions";

type Props = { specs: EspecificacaoFord[] };

function toNum(v: string) {
  const n = parseFloat(String(v).replace(",", "."));
  return isFinite(n) ? n : 0;
}

export function SpecsCharts({ specs }: Props) {
  const numericSpecs = useMemo(() => {
    return specs
      .map((s) => ({
        equipamento: s.equipamento,
        XLT: toNum(s.versaoXlt),
        Limited: toNum(s.versaoLimited),
        "Limited+": toNum(s.versaoLimitedPlus),
        raw: s,
      }))
      .filter((r) => r.XLT + r.Limited + r["Limited+"] > 0)
      .slice(0, 8);
  }, [specs]);

  if (numericSpecs.length === 0) {
    return (
      <div className="rounded-xl border bg-card/40 p-8 text-center text-sm text-muted-foreground">
        Sem dados numéricos suficientes para gráficos.
      </div>
    );
  }

  const radarData = numericSpecs.slice(0, 6).map((r) => {
    const max = Math.max(r.XLT, r.Limited, r["Limited+"]) || 1;
    return {
      spec: r.equipamento.slice(0, 18),
      XLT: (r.XLT / max) * 100,
      Limited: (r.Limited / max) * 100,
      "Limited+": (r["Limited+"] / max) * 100,
    };
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass rounded-2xl p-6 shadow-elegant">
        <h3 className="mb-4 font-display text-lg font-semibold">
          Comparativo entre versões
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={numericSpecs} margin={{ left: -10 }}>
            <CartesianGrid stroke="oklch(1 0 0 / 0.06)" />
            <XAxis
              dataKey="equipamento"
              tick={{ fontSize: 10, fill: "oklch(0.7 0.03 260)" }}
              tickFormatter={(v: string) =>
                v.length > 12 ? v.slice(0, 12) + "…" : v
              }
            />
            <YAxis tick={{ fontSize: 10, fill: "oklch(0.7 0.03 260)" }} />
            <Tooltip
              contentStyle={{
                background: "oklch(0.18 0.04 270)",
                border: "1px solid oklch(0.28 0.05 270)",
                borderRadius: 8,
                color: "white",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="XLT" fill="oklch(0.62 0.22 270)" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="Limited"
              fill="oklch(0.7 0.2 250)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Limited+"
              fill="oklch(0.78 0.18 80)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass rounded-2xl p-6 shadow-elegant">
        <h3 className="mb-4 font-display text-lg font-semibold">
          Radar de performance (normalizado)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="oklch(1 0 0 / 0.1)" />
            <PolarAngleAxis
              dataKey="spec"
              tick={{ fontSize: 10, fill: "oklch(0.7 0.03 260)" }}
            />
            <PolarRadiusAxis tick={{ fontSize: 9, fill: "oklch(0.5 0.03 260)" }} />
            <Radar
              name="XLT"
              dataKey="XLT"
              stroke="oklch(0.62 0.22 270)"
              fill="oklch(0.62 0.22 270)"
              fillOpacity={0.3}
            />
            <Radar
              name="Limited"
              dataKey="Limited"
              stroke="oklch(0.7 0.2 250)"
              fill="oklch(0.7 0.2 250)"
              fillOpacity={0.3}
            />
            <Radar
              name="Limited+"
              dataKey="Limited+"
              stroke="oklch(0.78 0.18 80)"
              fill="oklch(0.78 0.18 80)"
              fillOpacity={0.3}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
