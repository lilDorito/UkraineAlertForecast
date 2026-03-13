import pandas as pd
from merge_utils import (
    build_spine, merge_sources, save_to_csv,
    process_weather, process_alarms, process_reddit,
    process_telegram, process_isw,
)

PATHS = {
    "weather": "datasets/weather/weather_daily.csv",
    "alarms": "datasets/alarms/alarms_daily.csv",
    "reddit": "datasets/reddit/reddit_daily.csv",
    "telegram": "datasets/telegram/telegram_daily.csv",
    "isw": "datasets/isw/isw_daily.csv",
    "output": "datasets/merged.csv",
}

if __name__ == "__main__":
    yesterday = pd.Timestamp.now().floor("D") - pd.Timedelta(days=1)
    date_end = yesterday + pd.Timedelta(hours=23)

    print(f"Daily merge for {yesterday.date()}")
    print("Building spine...")
    spine = build_spine(str(yesterday.date()), date_end)
    print(f"  {len(spine)} rows\n")

    print("Processing sources...")
    weather = process_weather(PATHS["weather"])
    print("  [+] weather")
    alarms = process_alarms(PATHS["alarms"])
    print("  [+] alarms")
    telegram = process_telegram(PATHS["telegram"])
    print("  [+] telegram")
    isw = process_isw(PATHS["isw"])
    print("  [+] isw")
    reddit = process_reddit(PATHS["reddit"])
    print("  [+] reddit")

    print("\nMerging...")
    df = merge_sources(spine, weather, alarms, telegram, isw, reddit)

    print(f"Final shape: {df.shape}")
    save_to_csv(df, PATHS["output"])