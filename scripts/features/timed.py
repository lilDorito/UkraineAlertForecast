# [Auto] script for generating time features

import numpy as np
import pandas as pd

def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    ts = df["timestamp_hour"].dt
    df["hour"] = ts.hour.astype("int8")
    df["day_of_week"] = ts.dayofweek.astype("int8")
    df["is_weekend"] = (df["day_of_week"] >= 5).astype("int8")
    df["month"] = ts.month.astype("int8")
    df["day_of_year"] = ts.dayofyear.astype("int16")

    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24).astype("float32")
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24).astype("float32")
    df["dow_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7).astype("float32")
    df["dow_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7).astype("float32")
    return df
