export type HealthStatus = "green" | "yellow" | "red";
export type AnomalyTier = "normal" | "maybe" | "high";

export interface Summary {
  source: string;
  model: string;
  status: HealthStatus;
  counts: {
    rows_total: number;
    normal: number;
    maybe_anomaly: number;
    high_confidence_anomaly: number;
  };
  thresholds: {
    high_confidence_min_prob: number;
    low_confidence_min_prob: number;
  };
  definitions: Record<string, string>;
}

export interface AnomalyRow {
  row_id: number;
  type?: string;
  agentIP?: string;
  srcIP?: string;
  dstIP?: string;
  srcPort?: number;
  dstPort?: number;
  ipProtocol?: number;
  packetSize?: number;
  inVlan?: number;
  userclass?: string;
  true_userclass: string;
  predicted_userclass: string;
  max_probability: number;
  anomaly_tier: AnomalyTier;
}

export interface MisclassificationPair {
  true_userclass: string;
  predicted_userclass: string;
  count: number;
}

export interface Metrics {
  accuracy: number;
  classes: string[];
  misclassification_pairs: MisclassificationPair[];
}

export type PageId = "overview" | "anomalies" | "confusion";
