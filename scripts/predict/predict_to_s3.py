# [Auto/Manual] script for running model on generated features, output forecast to AWS S3

import os
import json
import numpy as np
import pandas as pd
import joblib
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODELS = os.path.join(ROOT, "models")
FEATURES = os.path.join(ROOT, "datasets", "features.csv")

S3_BUCKET = os.environ["S3_BUCKET"]
S3_PREFIX = os.environ.get("S3_PREFIX", "predictions")

TARGET_HOURS = list(range(6, 30))

def log(msg: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}")

def upload_json(s3_client, payload: dict, key: str) -> str:
    body = json.dumps(payload, indent=2).encode("utf-8")
    s3_client.put_object(
        Bucket=S3_BUCKET,
        Key=key,
        Body=body,
        ContentType="application/json",
        CacheControl="no-cache, no-store, must-revalidate",
    )
    return f"s3://{S3_BUCKET}/{key}"

def main():
    log("> Loading model & region mapping...")
    model = joblib.load(os.path.join(MODELS, "lgb_multioutput.pkl"))
    region_mapping = joblib.load(os.path.join(MODELS, "region_mapping.pkl"))
    inverse_mapping = {v: k for k, v in region_mapping.items()}
    log(f"  [i] {len(region_mapping)} regions loaded\n")

    log("> Loading features...")
    df = pd.read_csv(FEATURES)
    df["timestamp_hour"] = pd.to_datetime(df["timestamp_hour"])
    df = df.copy()

    target_cols = [c for c in df.columns if "target_" in c]
    df["region_encoded"] = df["region_id"].map(inverse_mapping).fillna(-1)

    latest = (df.sort_values("timestamp_hour").groupby("region_id").last().reset_index())

    base_time = latest["timestamp_hour"].max()
    log(f"  [i] Latest timestamp: {base_time}")
    log(f"  [i] Regions: {len(latest)}\n")

    X_pred = latest.drop(columns=target_cols + ["timestamp_hour", "region_id"], errors="ignore").astype(np.float32)
    regions = latest["region_id"].tolist()

    log("> Predicting...")
    probas = np.array([est.predict_proba(X_pred)[:, 1] for est in model.estimators_])
    global_max = probas.max()
    normalized = (probas / global_max) * 0.99

    regions_forecast: dict = {}

    for region_idx, region in enumerate(regions):
        regions_forecast[region] = {}
        for hour_idx, h in enumerate(TARGET_HOURS):
            ts = (base_time + pd.Timedelta(hours=h)).strftime("%Y-%m-%dT%H:00:00Z")
            prob = float(normalized[hour_idx, region_idx])
            score = float(probas[hour_idx, region_idx])
            binary = prob >= 0.5
            regions_forecast[region][ts] = {
                "score": round(score, 4),
                "probability": round(prob, 4),
                "binary": binary,
            }

    generated_at = datetime.now(timezone.utc)

    output = {
        "generated_at": generated_at.isoformat(),
        "base_time": base_time.isoformat(),
        "n_regions": len(regions),
        "n_hours": len(TARGET_HOURS),
        "global_max_score": round(float(global_max), 4),
        "regions_forecast": regions_forecast,
    }

    log("\n> Uploading to S3...")
    s3 = boto3.client("s3")

    timestamp_str = generated_at.strftime("%Y-%m-%dT%H-%M-%SZ")
    timestamped_key = f"{S3_PREFIX}/{timestamp_str}.json"
    latest_key = f"{S3_PREFIX}/latest.json"

    try:
        uri_ts = upload_json(s3, output, timestamped_key)
        uri_latest = upload_json(s3, output, latest_key)
    except (BotoCoreError, ClientError) as exc:
        log(f"\n[!] S3 upload failed: {exc}")
        raise SystemExit(1) from exc

    log(f"  [+] Timestamped: {uri_ts}")
    log(f"  [+] Latest: {uri_latest}")
    log(f"\n  {len(regions)} regions x {len(TARGET_HOURS)} hours")
    log(f"  Base time: {output['base_time']}")
    log(f"  Global max: {output['global_max_score']}")

if __name__ == "__main__":
    main()