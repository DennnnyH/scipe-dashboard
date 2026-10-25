import type { AnomalyRow, Metrics, Summary } from "../types";

import summaryJson from "@data/summary.json";
import anomaliesJson from "@data/anomalies.json";
import metricsJson from "@data/metrics.json";

export function loadDashboardData(): {
  summary: Summary;
  anomalies: AnomalyRow[];
  metrics: Metrics;
} {
  const anomalies = (anomaliesJson as { rows: AnomalyRow[] }).rows;
  return {
    summary: summaryJson as Summary,
    anomalies,
    metrics: metricsJson as Metrics,
  };
}
