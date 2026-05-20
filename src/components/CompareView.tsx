import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
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
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { ComparisonData } from "@/lib/ford.functions";

type Props = { data: ComparisonData };

const FORD_COLOR = "oklch(0.62 0.22 270)";
const RIVAL_COLOR = "oklch(0.7 0.2 25)";

function extractNumber(v: string): number | null {
  if (!v) return null;
  const s = v.replace(/\./g, "").replace(",", ".");
  const m = s.match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return isFinite(n) ? n : null;
}

function prettify(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\bkmh\b/gi, "km/h");
}

function unitOf(v: string) {
  const m = v.match(/[a-zA-Z/°²³]+(?:\s*[a-zA-Z/°²³]+)?$/);
  return m ? m[0].trim() : "";
}

const LOWER_BETTER = /aceler|consumo.*ur|peso/i;

function compare(fordN: number, rivalN: number, attr: string) {
  if (fordN === rivalN) return "tie" as const;
  const fordBetter = LOWER_BETTER.test(attr) ? fordN < rivalN : fordN > rivalN;
  return fordBetter ? "ford" : "rival";
}

export function ComparisonTable({ data }: Props) {
  const rows = useMemo(() => {
    return data.attributes.map((attr) => {
      const f = data.fordSpecs[attr] ?? "—";
      const r = data.rivalSpecs[attr] ?? "—";
      const fn = extractNumber(f);
      const rn = extractNumber(r);
      const winner =
        fn != null && rn != null ? compare(fn, rn, attr) : ("na" as const);
      return { attr, f, r, fn, rn, winner };
    });
  }, [data]);

  const fordWins = rows.filter((r) => r.winner === "ford").length;
  const rivalWins = rows.filter((r) => r.winner === "rival").length;
  const ties = rows.filter((r) => r.winner === "tie").length;

  return (
    <div className="glass overflow-hidden rounded-2xl shadow-elegant">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b bg-gradient-card p-6">
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Ford
          </div>
          <div className="font-display text-xl font-bold text-primary">
            {data.fordName}
          </div>
          <div className="mt-2 text-3xl font-bold text-primary">{fordWins}</div>
        </div>
        <div className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          <div>vs</div>
          {ties > 0 && (
            <div className="mt-1 text-[10px]">{ties} empate{ties > 1 ? "s" : ""}</div>
          )}
        </div>
        <div className="text-left">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Concorrente
          </div>
          <div className="font-display text-xl font-bold text-[color:var(--rival)]">
            {data.rivalName}
          </div>
          <div className="mt-2 text-3xl font-bold text-[color:var(--rival)]">
            {rivalWins}
          </div>
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {rows.map((row, i) => (
          <motion.div
            key={row.attr}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-3 transition hover:bg-primary/5"
          >
            <div
              className={`text-right text-sm ${
                row.winner === "ford"
                  ? "font-semibold text-primary"
                  : "text-foreground/80"
              }`}
            >
              {row.f}
              {row.winner === "ford" && (
                <Check className="ml-2 inline h-4 w-4 text-primary" />
              )}
            </div>
            <div className="min-w-[140px] text-center text-[11px] uppercase tracking-wider text-muted-foreground">
              {prettify(row.attr)}
            </div>
            <div
              className={`text-left text-sm ${
                row.winner === "rival"
                  ? "font-semibold text-[color:var(--rival)]"
                  : "text-foreground/80"
              }`}
            >
              {row.winner === "rival" && (
                <Check className="mr-2 inline h-4 w-4 text-[color:var(--rival)]" />
              )}
              {row.r}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function CompareCharts({ data }: Props) {
  const numericRows = useMemo(() => {
    return data.attributes
      .map((attr) => {
        const fn = extractNumber(data.fordSpecs[attr] ?? "");
        const rn = extractNumber(data.rivalSpecs[attr] ?? "");
        if (fn == null || rn == null) return null;
        return {
          attr,
          label: prettify(attr),
          ford: fn,
          rival: rn,
          unit: unitOf(data.fordSpecs[attr] ?? ""),
        };
      })
      .filter(Boolean) as {
      attr: string;
      label: string;
      ford: number;
      rival: number;
      unit: string;
    }[];
  }, [data]);

  const radarData = useMemo(() => {
    return numericRows.slice(0, 8).map((r) => {
      const max = Math.max(r.ford, r.rival) || 1;
      return {
        spec: r.label.slice(0, 16),
        [data.fordName]: Math.round((r.ford / max) * 100),
        [data.rivalName]: Math.round((r.rival / max) * 100),
      };
    });
  }, [numericRows, data]);

  const winnerData = useMemo(() => {
    let f = 0,
      r = 0,
      t = 0;
    numericRows.forEach((row) => {
      const w = compare(row.ford, row.rival, row.attr);
      if (w === "ford") f++;
      else if (w === "rival") r++;
      else t++;
    });
    return [
      { name: data.fordName, value: f, color: FORD_COLOR },
      { name: data.rivalName, value: r, color: RIVAL_COLOR },
      ...(t > 0
        ? [{ name: "Empate", value: t, color: "oklch(0.5 0.02 270)" }]
        : []),
    ];
  }, [numericRows, data]);

  const diffData = useMemo(() => {
    return numericRows
      .map((r) => ({
        label: r.label.slice(0, 16),
        diff: r.ford - r.rival,
        fordBetter: compare(r.ford, r.rival, r.attr) === "ford",
      }))
      .slice(0, 10);
  }, [numericRows]);

  if (numericRows.length === 0) {
    return (
      <div className="rounded-xl border bg-card/40 p-8 text-center text-sm text-muted-foreground">
        Sem dados numéricos suficientes para gerar gráficos.
      </div>
    );
  }

  const tooltipStyle = {
    background: "oklch(0.18 0.04 270)",
    border: "1px solid oklch(0.28 0.05 270)",
    borderRadius: 8,
    color: "white",
    fontSize: 12,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI
          label="Atributos comparados"
          value={numericRows.length}
          color="text-foreground"
        />
        <KPI
          label={`Vitórias ${data.fordName}`}
          value={winnerData[0].value}
          color="text-primary"
        />
        <KPI
          label={`Vitórias ${data.rivalName}`}
          value={winnerData[1].value}
          color="text-[color:var(--rival)]"
        />
        <KPI
          label="Cobertura comparativa"
          value={`${Math.round(
            (numericRows.length / data.attributes.length) * 100,
          )}%`}
          color="text-accent"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Radar comparativo (normalizado)">
          <RadarChart data={radarData}>
            <PolarGrid stroke="oklch(1 0 0 / 0.1)" />
            <PolarAngleAxis
              dataKey="spec"
              tick={{ fontSize: 10, fill: "oklch(0.7 0.03 260)" }}
            />
            <PolarRadiusAxis
              tick={{ fontSize: 9, fill: "oklch(0.5 0.03 260)" }}
              domain={[0, 100]}
            />
            <Radar
              name={data.fordName}
              dataKey={data.fordName}
              stroke={FORD_COLOR}
              fill={FORD_COLOR}
              fillOpacity={0.4}
            />
            <Radar
              name={data.rivalName}
              dataKey={data.rivalName}
              stroke={RIVAL_COLOR}
              fill={RIVAL_COLOR}
              fillOpacity={0.4}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </RadarChart>
        </ChartCard>

        <ChartCard title="Distribuição de vitórias">
          <PieChart>
            <Pie
              data={winnerData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={3}
              dataKey="value"
              label={(e: { name: string; value: number }) =>
                `${e.value}`
              }
              labelLine={false}
            >
              {winnerData.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ChartCard>

        <ChartCard title="Comparativo absoluto" wide>
          <BarChart data={numericRows} margin={{ left: -10, bottom: 30 }}>
            <CartesianGrid stroke="oklch(1 0 0 / 0.06)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "oklch(0.7 0.03 260)" }}
              angle={-30}
              textAnchor="end"
              height={70}
            />
            <YAxis tick={{ fontSize: 10, fill: "oklch(0.7 0.03 260)" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              name={data.fordName}
              dataKey="ford"
              fill={FORD_COLOR}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              name={data.rivalName}
              dataKey="rival"
              fill={RIVAL_COLOR}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartCard>

        <ChartCard title="Diferença (Ford − Concorrente)" wide>
          <BarChart data={diffData} margin={{ left: -10, bottom: 30 }}>
            <CartesianGrid stroke="oklch(1 0 0 / 0.06)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "oklch(0.7 0.03 260)" }}
              angle={-30}
              textAnchor="end"
              height={70}
            />
            <YAxis tick={{ fontSize: 10, fill: "oklch(0.7 0.03 260)" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="diff" radius={[4, 4, 0, 0]}>
              {diffData.map((d, i) => (
                <Cell key={i} fill={d.fordBetter ? FORD_COLOR : RIVAL_COLOR} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 font-display text-3xl font-bold ${color}`}>
        {value}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  wide,
}: {
  title: string;
  children: React.ReactElement;
  wide?: boolean;
}) {
  return (
    <div
      className={`glass rounded-2xl p-6 shadow-elegant ${
        wide ? "lg:col-span-2" : ""
      }`}
    >
      <h3 className="mb-4 font-display text-lg font-semibold">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export { CompareCharts as SpecsCharts };
