import type { Summary } from "../types";

function Card({
  title,
  value,
  subtitle,
  accent,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-uh-green/10 bg-white p-5 shadow-card">
      <div className={`mb-3 h-1 w-12 rounded-full ${accent}`} />
      <p className="text-sm font-medium text-uh-slate/70">{title}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-uh-green">
        {value.toLocaleString()}
      </p>
      <p className="mt-2 text-xs text-uh-slate/60">{subtitle}</p>
    </div>
  );
}

export function StatCards({ summary }: { summary: Summary }) {
  const { counts } = summary;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Card
        title="Non-anomalies"
        value={counts.normal}
        subtitle="Predicted class matches mapped userclass"
        accent="bg-status-green"
      />
      <Card
        title="Unlabeled"
        value={counts.unlabeled}
        subtitle="No mapped userclass for srcIP"
        accent="bg-status-unlabeled"
      />
      <Card
        title="Maybe anomalies"
        value={counts.maybe_anomaly}
        subtitle="Misclassified, lower model confidence"
        accent="bg-status-yellow"
      />
      <Card
        title="High-confidence anomalies"
        value={counts.high_confidence_anomaly}
        subtitle={`Misclassified with ≥ ${(summary.thresholds.high_confidence_min_prob * 100).toFixed(0)}% confidence`}
        accent="bg-status-red"
      />
      <Card
        title="Flows scored"
        value={counts.rows_total}
        subtitle="All processed_data rows, including unlabeled"
        accent="bg-uh-gold"
      />
    </div>
  );
}
