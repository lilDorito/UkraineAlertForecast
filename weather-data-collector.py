import requests
import pandas as pd
import time

from regions import REGIONS

def fetch_weather_for_all_regions():
    weather_results = []
    base_url = "https://api.open-meteo.com/v1/forecast"

    print(f"Data collecting has been started for {len(REGIONS)} refions...")
    for name_ua, (lat, lon, name_en) in REGIONS.items():
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": ["temperature_2m", "relative_humidity_2m", "wind_speed_10m"],
            "timezone": "auto"
        }
        try:
            response = requests.get(base_url, params=params)
            response.raise_for_status()
            data = response.json()
            current = data['current']
            weather_results.append({
                "Region": name_en,
                "Temp_C": current['temperature_2m'],
                "Humidity_%": current['relative_humidity_2m'],
                "Wind_kmh": current['wind_speed_10m']
            })
            print(f"Data been collected for: {name_en}")
        except Exception as e:
            print(f"Error {name_en}: {e}")
        time.sleep(0.1)
    return pd.DataFrame(weather_results)

if __name__ == "__main__":
    df = fetch_weather_for_all_regions()
    df.to_csv("current_ukraine_weather.csv", index=False)
    print("\n--- Data has been saved to current_ukraine_weather.csv ---")
    print(df.head())