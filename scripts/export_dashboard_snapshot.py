"""
Score userclasses_mapped_v2.csv with the saved model and write dashboard JSON.

Does not train. The bundle is user_classification_model.joblib:
  model, scaler, label_encoders, target_encoder, feature_columns, missing_values.

Run from repo root:
  python scripts/export_dashboard_snapshot.py
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = REPO_ROOT / "userclasses_mapped_v2.csv"
MODEL_PATH = REPO_ROOT / "user_classification_model.joblib"
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


def encode_column(series: pd.Series, encoder, fallback: float) -> pd.Series:
    classes = {str(label): index for index, label in enumerate(encoder.classes_)}
    fallback_code = int(fallback)

    def one(value: object) -> int:
        if pd.isna(value):
            return fallback_code
        return classes.get(str(value).strip(), fallback_code)

    return series.map(one)


def transform_features(df: pd.DataFrame, bundle: dict) -> np.ndarray:
    columns = bundle["feature_columns"]
    missing = df.columns.difference(columns)
    absent = [column for column in columns if column not in df.columns]
    if absent:
        raise SystemExit(f"CSV is missing model features: {absent}")

    encoders = bundle["label_encoders"]
    medians = bundle["missing_values"]
    frame = pd.DataFrame(index=df.index)
    for column in columns:
        if column in encoders:
            frame[column] = encode_column(df[column], encoders[column], medians[column])
        else:
            frame[column] = pd.to_numeric(df[column], errors="coerce").fillna(medians[column])

    del missing
    scaled = bundle["scaler"].transform(frame[columns])
    return pd.DataFrame(scaled, columns=columns)


def main() -> None:
    if not CSV_PATH.exists():
        raise SystemExit(f"Missing labeled CSV: {CSV_PATH}")
    if not MODEL_PATH.exists():
        raise SystemExit(f"Missing model: {MODEL_PATH}")

    bundle = joblib.load(MODEL_PATH)
    model = bundle["model"]
    target_encoder = bundle["target_encoder"]

    df = pd.read_csv(CSV_PATH)
    df["userclass"] = df["userclass"].astype(str).str.strip()
    df["userclass"] = df["userclass"].replace({"Externel": "External"})

    features = transform_features(df, bundle)
    proba = model.predict_proba(features)
    max_proba = proba.max(axis=1)
    pred_labels = target_encoder.inverse_transform(model.predict(features))
    true_labels = df["userclass"].to_numpy()

    is_misclassified = pred_labels != true_labels
    tiers = [
        anomaly_tier(bool(flag), float(score))
        for flag, score in zip(is_misclassified, max_proba, strict=True)
    ]

    counts = {
        "rows_total": int(len(tiers)),
        "normal": int(sum(tier == "normal" for tier in tiers)),
        "maybe_anomaly": int(sum(tier == "maybe" for tier in tiers)),
        "high_confidence_anomaly": int(sum(tier == "high" for tier in tiers)),
    }

    summary = {
        "source": "userclasses_mapped_v2.csv scored by user_classification_model.joblib",
        "model": bundle.get("model_name", type(model).__name__),
        "status": overall_status(counts),
        "counts": counts,
        "thresholds": {
            "high_confidence_min_prob": HIGH_CONF_THRESHOLD,
            "low_confidence_min_prob": LOW_CONF_THRESHOLD,
        },
        "definitions": {
            "anomaly": "predicted_userclass != true_userclass",
            "high": "misclassified and max(predict_proba) >= high threshold (confidently wrong)",
            "maybe": "misclassified and max(predict_proba) < high threshold",
            "normal": "correct prediction",
        },
    }

    scored = df.copy()
    scored["row_id"] = np.arange(len(scored))
    scored["true_userclass"] = true_labels
    scored["predicted_userclass"] = pred_labels
    scored["max_probability"] = max_proba
    scored["is_misclassified"] = is_misclassified
    scored["anomaly_tier"] = tiers

    display_cols = [column for column in DISPLAY_COLS if column in scored.columns]
    anomaly_rows = scored[scored["is_misclassified"]].copy()
    anomaly_rows = anomaly_rows.sort_values(
        ["anomaly_tier", "max_probability"],
        ascending=[True, False],
    )

    def row_to_dict(row: pd.Series) -> dict:
        out = {column: row[column] for column in display_cols}
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
        "rows": [row_to_dict(row) for _, row in anomaly_rows.iterrows()],
    }

    accuracy = float((pred_labels == true_labels).mean())
    metrics = {
        "accuracy": round(accuracy, 6),
        "classes": [str(label) for label in target_encoder.classes_],
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
    (OUT_DIR / "metrics.json").write_text(json.dumps(metrics, indent=2, default=str))

    print(f"Wrote dashboard snapshot to {OUT_DIR}")
    print(f"Status: {summary['status']} | counts: {counts} | accuracy: {accuracy:.4f}")


if __name__ == "__main__":
    main()
