import pandas as pd
from datetime import datetime, timedelta, timezone
import os
import sys
import asyncio
from telethon import TelegramClient
from dotenv import load_dotenv

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUTPUT_FILE = os.path.join(ROOT, "datasets", "telegram", "telegram_daily.csv")
LOG_FILE = os.path.join(ROOT, "logs", "telegram", "daily_collector.log")
SESSION = os.path.join(ROOT, "scripts", "telegram", "session")

sys.path.append(os.path.join(ROOT, "scripts", "util"))
from util.text_cleaner import clean_text as clean
from util.event_detector import detect_events

load_dotenv(os.path.join(ROOT, ".env"))
API_ID   = int(os.getenv("TELEGRAM_API_ID"))
API_HASH = os.getenv("TELEGRAM_API_HASH")

CHANNELS = [
    "radar_raketa", "Ukraine_UA_24_7", "air_alert_telegram", "alarmua",
    "ukrpravda_news", "pravda_ukraineee", "suspilnenews", "uniannet",
    "hromadske_ua", "war_monitor", "nexta_live", "GeneralStaffZSU", "kpszsu"
]

today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
SINCE = today - timedelta(days=1)
UNTIL = today

def log(msg: str):
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")

async def main():
    log("> Telegram daily collector starting <")
    log(f"Window: {SINCE.date()} 00:00 UTC -> {UNTIL.date()} 00:00 UTC")

    rows = []

    async with TelegramClient(SESSION, API_ID, API_HASH) as client:
        for channel in CHANNELS:
            log(f"Fetching {channel}...")
            channel_count = 0
            try:
                async for message in client.iter_messages(channel, offset_date=UNTIL, reverse=False):
                    if message.date < SINCE:
                        break
                    if not message.text:
                        continue
                    cleaned = clean(message.text)
                    events = detect_events(cleaned)
                    if not events:
                        continue
                    rows.append({
                        "message_id":   message.id,
                        "message_date": message.date,
                        "message_text": cleaned,
                        "channel":      channel,
                        "events":       ",".join(sorted(events))
                    })
                    channel_count += 1
            except Exception as e:
                log(f"[!] Error in {channel}: {e}")

            log(f"  -> {channel_count} messages collected from {channel}")

    if not rows:
        log("Nothing collected.")
        return

    df = pd.DataFrame(rows)
    df = df.drop_duplicates(subset=["message_id"])
    df = df.sort_values("message_date", ascending=False)
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    df.to_csv(OUTPUT_FILE, mode="w", index=False, header=True, encoding="utf-8")
    log(f"Collected {len(df)} messages -> {OUTPUT_FILE}")
    log("Done.\n")

if __name__ == "__main__":
    asyncio.run(main())
