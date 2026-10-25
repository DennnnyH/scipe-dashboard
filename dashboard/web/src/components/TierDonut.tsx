import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Summary } from "../types";

const COLORS = {
  normal: "#2D6A4F",
  maybe: "#B8860B",
  high: "#9B2335",
};

/** Minimum slice angle (degrees) so tiny categories stay visible in the donut. */
const MIN_SLICE_ANGLE = 10;

export function TierDonut({ summary }: { summary: Summary }) {
  const total = summary.counts.rows_total;
  const segments = [
    {
      name: "Non-anomalies",
      value: summary.counts.normal,
      color: COLORS.normal,
    },
    {
      name: "Maybe",
      value: summary.counts.maybe_anomaly,
      color: COLORS.maybe,
    },
    {
      name: "High confidence",
      value: summary.counts.high_confidence_anomaly,
      color: COLORS.high,
    },
  ];

  const normalPct = total > 0 ? (summary.counts.normal / total) * 100 : 0;

  const formatShare = (value: number) => {
    if (total === 0) return "0%";
    const pct = (value / total) * 100;
    if (pct > 0 && pct < 0.01) return "<0.01%";
    return `${pct.toFixed(2)}%`;
  };

  return (
    <div className="rounded-xl border border-uh-green/10 bg-white p-5 shadow-card">
      <h3 className="text-sm font-semibold text-uh-green">Outcome mix</h3>
      <p className="mt-1 text-xs text-uh-slate/60">
        All evaluated test flows ({total.toLocaleString()})
      </p>

      <div className="relative mt-2 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={2}
              minAngle={MIN_SLICE_ANGLE}
              isAnimationActive={false}
            >
              {segments.map((s) => (
                <Cell key={s.name} fill={s.color} stroke="#fff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, name: string) => [
                `${Number(v).toLocaleString()} (${formatShare(Number(v))} of all flows)`,
                name,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => {
                const item = segments.find((s) => s.name === value);
                if (!item) return value;
                return `${value}: ${item.value.toLocaleString()} (${formatShare(item.value)})`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div
          className="pointer-events-none absolute left-1/2 top-[42%] flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
          aria-hidden
        >
          <span className="text-xl font-bold leading-none text-uh-green">
            {normalPct.toFixed(1)}%
          </span>
          <span className="mt-1 text-[10px] leading-tight text-uh-slate/60">
            non-anomalies
          </span>
        </div>
      </div>

      <p className="mt-1 text-[10px] leading-relaxed text-uh-slate/50">
        Small slices use a minimum angle so Maybe and High confidence stay visible;
        legend and tooltip show exact counts and shares.
      </p>
    </div>
  );
}
