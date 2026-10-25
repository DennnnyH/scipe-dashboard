import type { Metrics, Summary } from "../types";
import { StatCards } from "../components/StatCards";
import { StatusBanner } from "../components/StatusBanner";
import { ConfusionChart } from "../components/ConfusionChart";
import { TierDonut } from "../components/TierDonut";

export function OverviewPage({
  summary,
  metrics,
}: {
  summary: Summary;
  metrics: Metrics;
}) {
  return (
    <div className="space-y-6">
      <StatusBanner summary={summary} />
      <StatCards summary={summary} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-uh-green/10 bg-white p-5 shadow-card lg:col-span-1">
          <h3 className="text-sm font-semibold text-uh-green">Model</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-uh-slate/60">Algorithm</dt>
              <dd className="font-medium">{summary.model}</dd>
            </div>
            <div>
              <dt className="text-uh-slate/60">Test accuracy</dt>
              <dd className="text-2xl font-bold text-uh-green">
                {(metrics.accuracy * 100).toFixed(2)}%
              </dd>
            </div>
            <div>
              <dt className="text-uh-slate/60">Classes</dt>
              <dd>{metrics.classes.length} user types</dd>
            </div>
          </dl>
        </div>
        <div className="lg:col-span-2">
          <TierDonut summary={summary} />
        </div>
      </div>

      <ConfusionChart pairs={metrics.misclassification_pairs} />
    </div>
  );
}
