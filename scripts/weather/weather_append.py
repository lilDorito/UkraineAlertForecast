import pandas as pd
import os
from datetime import datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FULL_FILE  = os.path.join(ROOT, "datasets", "weather", "weather_data.csv")
DAILY_FILE = os.path.join(ROOT, "datasets", "weather", "weather_daily.csv")

def log(msg: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}")

def main():
    log("> Weather append starting <")

    if not os.path.exists(DAILY_FILE):
        log("[!] No daily file found, nothing to append.")
        return

    full = pd.read_csv(FULL_FILE) if os.path.exists(FULL_FILE) else pd.DataFrame()
    daily = pd.read_csv(DAILY_FILE)

    log(f"Full: {len(full):,} rows | Daily: {len(daily):,} rows")

    combined = pd.concat([full, daily], ignore_index=True)
    before = len(combined)
    combined.drop_duplicates(subset=["region_id", "datetime"], keep="first", inplace=True)
    log(f"Dedup: {before:,} -> {len(combined):,} rows ({before - len(combined)} dropped)")

    combined.sort_values("datetime", inplace=True)

    os.makedirs(os.path.dirname(FULL_FILE), exist_ok=True)
    combined.to_csv(FULL_FILE, index=False)
    log(f"Saved {len(combined):,} rows -> {FULL_FILE}")
    log("Done.\n")

if __name__ == "__main__":
    main()