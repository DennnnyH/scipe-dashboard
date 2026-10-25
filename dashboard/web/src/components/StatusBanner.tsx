import type { HealthStatus, Summary } from "../types";

const STYLES: Record<
  HealthStatus,
  { bg: string; ring: string; label: string; hint: string }
> = {
  green: {
    bg: "bg-status-green",
    ring: "ring-status-green/30",
    label: "Healthy",
    hint: "No misclassifications on the evaluated test flows.",
  },
  yellow: {
    bg: "bg-status-yellow",
    ring: "ring-status-yellow/30",
    label: "Review suggested",
    hint: "Low-confidence misclassifications detected — worth a look.",
  },
  red: {
    bg: "bg-status-red",
    ring: "ring-status-red/30",
    label: "Attention required",
    hint: "High-confidence misclassifications — model was sure but wrong.",
  },
};

export function StatusBanner({ summary }: { summary: Summary }) {
  const s = STYLES[summary.status];
  return (
    <div
      className={`rounded-xl p-6 text-white shadow-card ring-4 ${s.bg} ${s.ring}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/80">
            Classification health
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">{s.label}</h2>
          <p className="mt-2 max-w-xl text-sm text-white/90">{s.hint}</p>
        </div>
        <div className="rounded-lg bg-black/15 px-4 py-2 text-right text-sm">
          <p className="text-white/70">Data source</p>
          <p className="font-medium">{summary.source}</p>
        </div>
      </div>
    </div>
  );
}
