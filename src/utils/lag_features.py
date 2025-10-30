"""
Lag Time and Previous Timestamp Feature Engineering for Transaction/Log Data

This module provides utilities for creating lag features from time-series transaction data,
particularly useful for analyzing temporal patterns in account activity.
"""

import pandas as pd
from typing import Optional, List


def create_lag_features(
    df: pd.DataFrame,
    group_col: str = "account",
    time_col: str = "ts",
    value_cols: Optional[List[str]] = None,
    lag_periods: List[int] = [1, 2],
    timezone: str = "Asia/Seoul"
) -> pd.DataFrame:
    """
    Create lag time features and previous timestamp columns for grouped time-series data.

    Args:
        df: Input DataFrame with transaction/log data
        group_col: Column name for grouping (e.g., 'account', 'user_id')
        time_col: Column name for timestamp
        value_cols: List of columns to create lag features for (e.g., ['amount', 'balance'])
        lag_periods: List of lag periods to create (default: [1, 2] for 1-step and 2-step lags)
        timezone: Timezone string for datetime conversion (default: 'Asia/Seoul')

    Returns:
        DataFrame with additional lag feature columns:
        - prev_ts: Previous timestamp within group
        - lag_time: Time difference from previous event (timedelta64)
        - lag_minutes: Time difference in minutes (float)
        - lag_hours: Time difference in hours (float)
        - {col}_lag{n}: Lag values for each specified column and period

    Example:
        >>> df = pd.DataFrame({
        ...     "account": ["A", "A", "A", "B", "B"],
        ...     "ts": ["2025-10-11 14:00:00", "2025-10-11 14:35:20",
        ...            "2025-10-11 16:10:05", "2025-10-11 09:00:00",
        ...            "2025-10-11 10:30:00"],
        ...     "amount": [10000, -12500, -8000, 200000, -50000]
        ... })
        >>> result = create_lag_features(df, value_cols=["amount"])
        >>> print(result[["account", "ts", "prev_ts", "lag_minutes", "amount_lag1"]])
    """
    # Create a copy to avoid modifying original
    result = df.copy()

    # Convert timestamp column to datetime with timezone
    if not pd.api.types.is_datetime64_any_dtype(result[time_col]):
        result[time_col] = pd.to_datetime(result[time_col], utc=True).dt.tz_convert(timezone)
    elif result[time_col].dt.tz is None:
        # If datetime but no timezone, localize to UTC then convert
        result[time_col] = result[time_col].dt.tz_localize("UTC").dt.tz_convert(timezone)
    else:
        # Already has timezone, just convert
        result[time_col] = result[time_col].dt.tz_convert(timezone)

    # Sort by group and timestamp (critical for correct lag calculations)
    result = result.sort_values([group_col, time_col]).reset_index(drop=True)

    # 1) Create previous timestamp column
    result["prev_ts"] = result.groupby(group_col)[time_col].shift(1)

    # 2) Calculate lag time (time difference from previous event)
    result["lag_time"] = result[time_col] - result["prev_ts"]

    # 3) Convert lag time to useful units
    result["lag_seconds"] = result["lag_time"].dt.total_seconds()
    result["lag_minutes"] = result["lag_seconds"] / 60.0
    result["lag_hours"] = result["lag_seconds"] / 3600.0

    # 4) Create lag features for specified value columns
    if value_cols:
        for col in value_cols:
            if col not in result.columns:
                print(f"Warning: Column '{col}' not found in DataFrame, skipping...")
                continue

            for lag_period in lag_periods:
                lag_col_name = f"{col}_lag{lag_period}"
                result[lag_col_name] = result.groupby(group_col)[col].shift(lag_period)

    return result


def calculate_rolling_features(
    df: pd.DataFrame,
    group_col: str = "account",
    value_col: str = "amount",
    windows: List[int] = [3, 5, 10]
) -> pd.DataFrame:
    """
    Calculate rolling window statistics for each group.

    Args:
        df: Input DataFrame (should already have lag features from create_lag_features)
        group_col: Column name for grouping
        value_col: Column to calculate rolling statistics on
        windows: List of window sizes for rolling calculations

    Returns:
        DataFrame with additional rolling feature columns:
        - {col}_rolling_mean_{window}: Rolling mean
        - {col}_rolling_std_{window}: Rolling standard deviation
        - {col}_rolling_min_{window}: Rolling minimum
        - {col}_rolling_max_{window}: Rolling maximum
    """
    result = df.copy()

    for window in windows:
        # Rolling mean
        result[f"{value_col}_rolling_mean_{window}"] = (
            result.groupby(group_col)[value_col]
            .rolling(window=window, min_periods=1)
            .mean()
            .reset_index(level=0, drop=True)
        )

        # Rolling standard deviation
        result[f"{value_col}_rolling_std_{window}"] = (
            result.groupby(group_col)[value_col]
            .rolling(window=window, min_periods=1)
            .std()
            .reset_index(level=0, drop=True)
        )

        # Rolling min and max
        result[f"{value_col}_rolling_min_{window}"] = (
            result.groupby(group_col)[value_col]
            .rolling(window=window, min_periods=1)
            .min()
            .reset_index(level=0, drop=True)
        )

        result[f"{value_col}_rolling_max_{window}"] = (
            result.groupby(group_col)[value_col]
            .rolling(window=window, min_periods=1)
            .max()
            .reset_index(level=0, drop=True)
        )

    return result


def analyze_lag_patterns(
    df: pd.DataFrame,
    group_col: str = "account",
    lag_col: str = "lag_minutes"
) -> pd.DataFrame:
    """
    Analyze lag time patterns by group.

    Args:
        df: DataFrame with lag features
        group_col: Column name for grouping
        lag_col: Column name for lag time measurement

    Returns:
        Summary DataFrame with statistics per group
    """
    stats = df.groupby(group_col)[lag_col].agg([
        ("count", "count"),
        ("mean_lag", "mean"),
        ("median_lag", "median"),
        ("std_lag", "std"),
        ("min_lag", "min"),
        ("max_lag", "max"),
        ("p25_lag", lambda x: x.quantile(0.25)),
        ("p75_lag", lambda x: x.quantile(0.75))
    ]).reset_index()

    return stats


def export_features(
    df: pd.DataFrame,
    output_path: str,
    format: str = "parquet"
) -> None:
    """
    Export feature-engineered DataFrame to file.

    Args:
        df: DataFrame to export
        output_path: Output file path
        format: Output format ('parquet', 'csv', 'json')
    """
    if format == "parquet":
        df.to_parquet(output_path, index=False, engine="pyarrow")
        print(f"✓ Exported to Parquet: {output_path}")
    elif format == "csv":
        df.to_csv(output_path, index=False, encoding="utf-8-sig")
        print(f"✓ Exported to CSV: {output_path}")
    elif format == "json":
        df.to_json(output_path, orient="records", date_format="iso", indent=2)
        print(f"✓ Exported to JSON: {output_path}")
    else:
        raise ValueError(f"Unsupported format: {format}. Use 'parquet', 'csv', or 'json'")
