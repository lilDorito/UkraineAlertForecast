import pandas as pd
import os
from datetime import datetime
from merge_utils import (
    build_spine, merge_sources, save_to_csv,
    process_weather, process_reddit,
    process_telegram, process_isw,
)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

PATHS = {
    "weather": os.path.join(ROOT, "datasets/weather/weather_daily.csv"),
    "alarms_full": os.path.join(ROOT, "datasets/alarms/alarms_data.csv"),
    "reddit": os.path.join(ROOT, "datasets/reddit/reddit_daily.csv"),
    "telegram": os.path.join(ROOT, "datasets/telegram/telegram_daily.csv"),
    "isw": os.path.join(ROOT, "datasets/isw/isw_daily.csv"),
    "output": os.path.join(ROOT, "datasets/merged.csv"),
}

def log(msg: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}")

if __name__ == "__main__":
    # day_before_yesterday = pd.Timestamp.now("UTC").tz_localize(None).floor("D") - pd.Timedelta(days=2)
    # date_start = day_before_yesterday
    # date_end = day_before_yesterday + pd.Timedelta(hours=23)

    yesterday = pd.Timestamp.now("UTC").tz_localize(None).floor("D") - pd.Timedelta(days=1)
    date_start = yesterday
    date_end = yesterday + pd.Timedelta(hours=23)

    log(f"Daily merge for {date_start.date()}")
    log("Building spine...")
    spine = build_spine(str(date_start.date()), date_end)
    log(f"  {len(spine)} rows\n")

    log("Processing sources...")
    weather = process_weather(PATHS["weather"])
    log("  [+] weather")
    alarms = pd.DataFrame(columns=["timestamp_hour", "region", "alarms_started", "alarms_ended", "alarms_active", "alarm_duration_min_sum"])
    log("  [+] alarms")
    telegram = process_telegram(PATHS["telegram"])
    log("  [+] telegram")
    isw = process_isw(PATHS["isw"])
    log("  [+] isw")
    reddit = process_reddit(PATHS["reddit"])
    log("  [+] reddit")

    log("\nMerging...")
    df = merge_sources(spine, weather, alarms, telegram, isw, reddit)

    log(f"Final shape: {df.shape}")
    save_to_csv(df, PATHS["output"], alarms_path=PATHS["alarms_full"])