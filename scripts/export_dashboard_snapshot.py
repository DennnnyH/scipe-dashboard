"""
Build static dashboard data from the same pipeline as user_classification.ipynb.

Run from repo root:
  python scripts/export_dashboard_snapshot.py

Writes:
  dashboard/data/summary.json      — counts + overall green/yellow/red
  dashboard/data/anomalies.json    — misclassified rows for the review table
  dashboard/data/metrics.json      — accuracy, per-class stats
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

REPO_ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = REPO_ROOT / "userclasses_mapped_v2.csv"
OUT_DIR = REPO_ROOT / "dashboard" / "data"

HIGH_CONF_THRESHOLD = 0.85
LOW_CONF_THRESHOLD = 0.55

DISPLAY_COLS = [
    "type",
    "agentIP",
    "srcIP",
    "dstIP",
    "srcPort",
    "dstPort",
    "ipProtocol",
    "packetSize",
    "inVlan",
    "userclass",
]


def preprocess_data(df: pd.DataFrame):
    df_processed = df.copy()
    X = df_processed.drop("userclass", axis=1)
    y = df_processed["userclass"]

    cols_to_remove = [
        "agentIP",
        "srcMAC",
        "dstMAC",
        "srcIP",
        "dstIP",
        "srcIP_obfuscated",
        "dstIP_obfuscated",
    ]
    cols_to_remove = [c for c in cols_to_remove if c in X.columns]
    X = X.drop(cols_to_remove, axis=1)

    label_encoders = {}
    for col in X.select_dtypes(include=["object"]).columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        label_encoders[col] = le

    X = X.fillna(X.median(numeric_only=True))

    target_encoder = LabelEncoder()
    y_encoded = target_encoder.fit_transform(y)
    return X, y_encoded, label_encoders, target_encoder


def anomaly_tier(is_misclassified: bool, max_proba: float) -> str:
    if not is_misclassified:
        return "normal"
    if max_proba >= HIGH_CONF_THRESHOLD:
        return "high"
    return "maybe"


def overall_status(counts: dict[str, int]) -> str:
    if counts["high_confidence_anomaly"] > 0:
        return "red"
    if counts["maybe_anomaly"] > 0:
        return "yellow"
    return "green"


def main() -> None:
    if not CSV_PATH.exists():
        raise SystemExit(f"Missing training CSV: {CSV_PATH}")

    df = pd.read_csv(CSV_PATH)
    df["userclass"] = df["userclass"].replace(["Other", "Externel"], "External")
    df["userclass"] = df["userclass"].astype(str).str.strip()

    X, y, _label_encoders, target_encoder = preprocess_data(df)

    indices = np.arange(len(df))
    idx_train, idx_test, y_train, y_test = train_test_split(
        indices,
        y,
        test_size=0.5,
        random_state=42,
        stratify=y,
    )

    X_train = X.iloc[idx_train]
    X_test = X.iloc[idx_test]

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train_scaled, y_train)

    proba = model.predict_proba(X_test_scaled)
    max_proba = proba.max(axis=1)
    pred_enc = model.predict(X_test_scaled)
    pred_labels = target_encoder.inverse_transform(pred_enc)
    true_labels = target_encoder.inverse_transform(y_test)

    is_misclassified = pred_labels != true_labels
    tiers = [
        anomaly_tier(bool(m), float(p))
        for m, p in zip(is_misclassified, max_proba, strict=True)
    ]

    counts = {
        "rows_total": int(len(tiers)),
        "normal": int(sum(t == "normal" for t in tiers)),
        "maybe_anomaly": int(sum(t == "maybe" for t in tiers)),
        "high_confidence_anomaly": int(sum(t == "high" for t in tiers)),
    }

    summary = {
        "source": "user_classification.ipynb (test split, 50%)",
        "model": "RandomForestClassifier(n_estimators=100)",
        "status": overall_status(counts),
        "counts": counts,
        "thresholds": {
            "high_confidence_min_prob": HIGH_CONF_THRESHOLD,
            "low_confidence_min_prob": LOW_CONF_THRESHOLD,
        },
        "definitions": {
            "anomaly": "predicted_userclass != true_userclass (on held-out test rows)",
            "high": "misclassified and max(predict_proba) >= high threshold (confidently wrong)",
            "maybe": "misclassified and max(predict_proba) < high threshold",
            "normal": "correct prediction",
        },
    }

    original_test = df.iloc[idx_test].reset_index(drop=True)
    original_test["row_id"] = idx_test
    original_test["true_userclass"] = true_labels
    original_test["predicted_userclass"] = pred_labels
    original_test["max_probability"] = max_proba
    original_test["is_misclassified"] = is_misclassified
    original_test["anomaly_tier"] = tiers

    display_cols = [c for c in DISPLAY_COLS if c in original_test.columns]
    anomaly_rows = original_test[original_test["is_misclassified"]].copy()
    anomaly_rows = anomaly_rows.sort_values(
        ["anomaly_tier", "max_probability"],
        ascending=[True, False],
    )

    def row_to_dict(row: pd.Series) -> dict:
        out = {c: row[c] for c in display_cols}
        out.update(
            {
                "row_id": int(row["row_id"]),
                "true_userclass": row["true_userclass"],
                "predicted_userclass": row["predicted_userclass"],
                "max_probability": round(float(row["max_probability"]), 4),
                "anomaly_tier": row["anomaly_tier"],
            }
        )
        return out

    anomalies_payload = {
        "rows": [row_to_dict(r) for _, r in anomaly_rows.iterrows()],
    }

    accuracy = float((pred_labels == true_labels).mean())
    metrics = {
        "accuracy": round(accuracy, 6),
        "classes": list(target_encoder.classes_),
        "misclassification_pairs": (
            anomaly_rows.groupby(["true_userclass", "predicted_userclass"])
            .size()
            .reset_index(name="count")
            .sort_values("count", ascending=False)
            .head(20)
            .to_dict(orient="records")
        ),
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "summary.json").write_text(json.dumps(summary, indent=2))
    (OUT_DIR / "anomalies.json").write_text(
        json.dumps(anomalies_payload, indent=2, default=str)
    )
    (OUT_DIR / "metrics.json").write_text(json.dumps(metrics, indent=2))

    print(f"Wrote dashboard snapshot to {OUT_DIR}")
    print(f"Status: {summary['status']} | counts: {counts}")


if __name__ == "__main__":
    main()
