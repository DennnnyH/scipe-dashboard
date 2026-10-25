import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MisclassificationPair } from "../types";

export function ConfusionChart({ pairs }: { pairs: MisclassificationPair[] }) {
  const data = pairs.slice(0, 12).map((p) => ({
    name: `${p.true_userclass} → ${p.predicted_userclass}`,
    count: p.count,
  }));

  return (
    <div className="rounded-xl border border-uh-green/10 bg-white p-5 shadow-card">
      <h3 className="text-sm font-semibold text-uh-green">
        Top misclassification pairs
      </h3>
      <p className="mt-1 text-xs text-uh-slate/60">
        True label vs what the model predicted (test set)
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
            <Bar dataKey="count" fill="#024731" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
