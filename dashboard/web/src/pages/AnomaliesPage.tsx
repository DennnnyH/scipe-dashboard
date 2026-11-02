import { useState } from "react";
import type { AnomalyRow } from "../types";
import { AnomaliesTable } from "../components/AnomaliesTable";
import { SourceQueue } from "../components/SourceQueue";

export function AnomaliesPage({ anomalies }: { anomalies: AnomalyRow[] }) {
  const [sourceIp, setSourceIp] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-uh-green">Anomaly review</h2>
        <p className="mt-1 max-w-2xl text-sm text-uh-slate/70">
          Start with a source IP. The table below lists the misclassified flows
          for that address. Use <strong>Inspect</strong> to open one record.
        </p>
      </div>
      <SourceQueue rows={anomalies} selected={sourceIp} onSelect={setSourceIp} />
      <AnomaliesTable rows={anomalies} sourceIp={sourceIp} />
    </div>
  );
}
