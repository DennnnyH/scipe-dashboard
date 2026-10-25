import type { AnomalyRow } from "../types";
import { AnomaliesTable } from "../components/AnomaliesTable";

export function AnomaliesPage({ anomalies }: { anomalies: AnomalyRow[] }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-uh-green">Anomaly review</h2>
        <p className="mt-1 max-w-2xl text-sm text-uh-slate/70">
          Each row is a flow where the model&apos;s prediction did not match the
          true user class. Use <strong>Inspect</strong> to open the full record
          (e.g. true Fiscal vs predicted Admin).
        </p>
      </div>
      <AnomaliesTable rows={anomalies} />
    </div>
  );
}
