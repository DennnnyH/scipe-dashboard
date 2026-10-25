import type { AnomalyRow } from "../types";
import { TierBadge } from "./TierBadge";

interface FlowDetailDrawerProps {
  row: AnomalyRow | null;
  onClose: () => void;
}

export function FlowDetailDrawer({ row, onClose }: FlowDetailDrawerProps) {
  if (!row) return null;

  const fields = Object.entries(row).filter(
    ([k]) =>
      !["anomaly_tier", "true_userclass", "predicted_userclass", "max_probability"].includes(k),
  );

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-uh-green-dark/40 backdrop-blur-sm"
        aria-label="Close details"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-uh-green/20 bg-white shadow-2xl"
        role="dialog"
        aria-labelledby="flow-detail-title"
      >
        <header className="border-b border-uh-green/10 bg-uh-green px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-uh-gold-bright">Flow record</p>
              <h2 id="flow-detail-title" className="text-lg font-semibold">
                Row #{row.row_id}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm text-white/80 hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          <div className="rounded-lg border border-uh-green/15 bg-uh-sand/50 p-4">
            <p className="text-xs font-medium uppercase text-uh-slate/60">
              Classification mismatch
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <TierBadge tier={row.anomaly_tier} />
              <span className="text-sm">
                True:{" "}
                <strong className="text-uh-green">{row.true_userclass}</strong>
              </span>
              <span className="text-uh-slate/40">→</span>
              <span className="text-sm">
                Predicted:{" "}
                <strong className="text-status-red">
                  {row.predicted_userclass}
                </strong>
              </span>
            </div>
            <p className="mt-2 text-sm text-uh-slate/70">
              Model confidence:{" "}
              <span className="font-mono font-semibold">
                {(row.max_probability * 100).toFixed(1)}%
              </span>
            </p>
          </div>

          <h3 className="mt-6 text-sm font-semibold text-uh-green">
            Flow attributes
          </h3>
          <dl className="mt-3 space-y-2">
            {fields.map(([key, value]) => (
              <div
                key={key}
                className="grid grid-cols-[9rem_1fr] gap-2 border-b border-uh-green/5 py-2 text-sm"
              >
                <dt className="font-medium text-uh-slate/60">{key}</dt>
                <dd className="font-mono text-xs tabular-nums break-all text-uh-slate">
                  {String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </>
  );
}
