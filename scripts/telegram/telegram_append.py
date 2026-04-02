import pandas as pd
import os
from datetime import datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FULL_FILE = os.path.join(ROOT, "datasets", "telegram", "telegram_data.csv")
DAILY_FILE = os.path.join(ROOT, "datasets", "telegram", "telegram_daily.csv")

COLUMNS = ["message_id", "message_date", "message_text", "channel", "events", "region"]

def log(msg: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}")

def main():
    log("> Telegram append starting <")

    if not os.path.exists(DAILY_FILE):
        log("[!] No daily file found, nothing to append.")
        return

    full = pd.read_csv(FULL_FILE)  if os.path.exists(FULL_FILE)  else pd.DataFrame(columns=COLUMNS)
    daily = pd.read_csv(DAILY_FILE)

    if "region" not in full.columns:
        full["region"] = None

    log(f"Full: {len(full):,} rows | Daily: {len(daily):,} rows")

    combined = pd.concat([full, daily], ignore_index=True)
    combined["message_date"] = pd.to_datetime(
        combined["message_date"], format="ISO8601", utc=True
    ).dt.tz_localize(None)

    before = len(combined)
    combined.drop_duplicates(subset=["channel", "message_id"], keep="first", inplace=True)
    log(f"Dedup: {before:,} -> {len(combined):,} rows ({before - len(combined)} dropped)")

    combined.sort_values("message_date", inplace=True)
    os.makedirs(os.path.dirname(FULL_FILE), exist_ok=True)
    combined.to_csv(FULL_FILE, index=False, encoding="utf-8-sig")
    log(f"Saved {len(combined):,} rows -> {FULL_FILE}")
    log("Done.\n")

if __name__ == "__main__":
    main()