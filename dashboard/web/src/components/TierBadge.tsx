import type { AnomalyTier } from "../types";

const MAP: Record<
  AnomalyTier,
  { label: string; className: string }
> = {
  high: {
    label: "High",
    className: "bg-status-red/15 text-status-red ring-status-red/30",
  },
  maybe: {
    label: "Maybe",
    className: "bg-status-yellow/15 text-amber-800 ring-status-yellow/40",
  },
  normal: {
    label: "Normal",
    className: "bg-status-green/15 text-status-green ring-status-green/30",
  },
};

export function TierBadge({ tier }: { tier: AnomalyTier }) {
  const t = MAP[tier];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${t.className}`}
    >
      {t.label}
    </span>
  );
}
