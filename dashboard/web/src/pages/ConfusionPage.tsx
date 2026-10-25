import type { Metrics } from "../types";
import { ConfusionChart } from "../components/ConfusionChart";

export function ConfusionPage({ metrics }: { metrics: Metrics }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-uh-green">Class confusion patterns</h2>
        <p className="mt-1 text-sm text-uh-slate/70">
          Where the Random Forest most often confuses one campus user type for
          another — useful for tuning labels and training data.
        </p>
      </div>
      <ConfusionChart pairs={metrics.misclassification_pairs} />
      <div className="rounded-xl border border-uh-green/10 bg-white shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-uh-sand text-left text-xs uppercase text-uh-slate/70">
            <tr>
              <th className="px-4 py-3">True class</th>
              <th className="px-4 py-3">Predicted class</th>
              <th className="px-4 py-3">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-uh-green/5">
            {metrics.misclassification_pairs.map((p, i) => (
              <tr key={i} className="hover:bg-uh-sand/50">
                <td className="px-4 py-2.5 font-medium">{p.true_userclass}</td>
                <td className="px-4 py-2.5 text-status-red font-medium">
                  {p.predicted_userclass}
                </td>
                <td className="px-4 py-2.5 tabular-nums">{p.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
