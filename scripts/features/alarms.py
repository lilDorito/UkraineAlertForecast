# [Auto] script for generating alarm features

import pandas as pd
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from util.regions import NEIGHBORS

def add_alarm_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    for lag in [1, 3, 6, 12, 24]:
        df[f"alarm_active_lag{lag}"] = df.groupby("region_id")["alarms_active"].shift(lag)
        df[f"alarms_started_lag{lag}"] = df.groupby("region_id")["alarms_started"].shift(lag)

    for w in [3, 6, 12, 24]:
        df[f"alarm_active_roll{w}h"] = df.groupby("region_id")["alarms_active"].shift(1).rolling(w, min_periods=1).sum()

    snapshot = df.pivot_table(
        index="timestamp_hour",
        columns="region_id",
        values="alarms_active",
        aggfunc="max"
    ).fillna(0)

    neighbor_data = []
    for region, neighbors in NEIGHBORS.items():
        valid_neighbors = [n for n in neighbors if n in snapshot.columns]
        if valid_neighbors:
            count_series = snapshot[valid_neighbors].sum(axis=1)
            temp_df = count_series.reset_index()
            temp_df.columns = ["timestamp_hour", "neighbor_alarm_count"]
            temp_df["region_id"] = region
            neighbor_data.append(temp_df)

    if neighbor_data:
        neighbor_df = pd.concat(neighbor_data)
        df = df.merge(neighbor_df, on=["timestamp_hour", "region_id"], how="left")
        df["neighbor_alarm_count"] = df["neighbor_alarm_count"].fillna(0)
        df["alarm_active_neighbor_lag"] = df.groupby("region_id")["neighbor_alarm_count"].shift(1)

    df['consecutive_alarm_hours'] = df.groupby('region_id')['alarms_active'].transform(
        lambda x: x * (x.groupby((x != x.shift()).cumsum()).cumcount() + 1)
    ).fillna(0).astype("int16")

    df['hours_since_last_alarm'] = df.groupby('region_id')['alarms_active'].transform(
        lambda x: (x == 0).groupby((x != 0).cumsum()).cumcount()
    ).fillna(0).astype("int16")

    return df