import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnomalyRow, MisclassificationPair } from "../types";

const MAYBE_COLOR = "#B8860B";
const HIGH_COLOR = "#9B2335";

function tierCounts(anomalies: AnomalyRow[] | undefined) {
  const counts = new Map<string, { maybe: number; high: number }>();
  if (!anomalies) return counts;
  for (const row of anomalies) {
    const key = `${row.true_userclass}\0${row.predicted_userclass}`;
    const entry = counts.get(key) ?? { maybe: 0, high: 0 };
    if (row.anomaly_tier === "high") entry.high += 1;
    else if (row.anomaly_tier === "maybe") entry.maybe += 1;
    counts.set(key, entry);
  }
  return counts;
}

export function ConfusionChart({
  pairs,
  anomalies,
}: {
  pairs: MisclassificationPair[];
  anomalies?: AnomalyRow[];
}) {
  const byPair = tierCounts(anomalies);
  const split = Boolean(anomalies);
  const data = pairs.slice(0, 12).map((p) => {
    const tiers = byPair.get(`${p.true_userclass}\0${p.predicted_userclass}`) ?? {
      maybe: 0,
      high: 0,
    };
    return {
      name: `${p.true_userclass} → ${p.predicted_userclass}`,
      count: p.count,
      maybe: tiers.maybe,
      high: tiers.high,
    };
  });

  return (
    <div className="rounded-xl border border-uh-green/10 bg-white p-5 shadow-card">
      <h3 className="text-sm font-semibold text-uh-green">
        Top misclassification pairs
      </h3>
      <p className="mt-1 text-xs text-uh-slate/60">
        {split
          ? "Each bar is split into maybe anomalies and high-confidence anomalies."
          : "True label vs what the model predicted (test set)"}
      </p>
      <div className="mt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#02473122" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #02473133",
                fontSize: 12,
              }}
            />
            {split && (
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
              />
            )}
            {split && (
              <Bar dataKey="maybe" name="Maybe" stackId="tier" fill={MAYBE_COLOR} />
            )}
            {split && (
              <Bar
                dataKey="high"
                name="High confidence"
                stackId="tier"
                fill={HIGH_COLOR}
                radius={[0, 4, 4, 0]}
              />
            )}
            {!split && <Bar dataKey="count" fill="#024731" radius={[0, 4, 4, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
