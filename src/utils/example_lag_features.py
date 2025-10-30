"""
Example usage of lag_features module for transaction data analysis.

This script demonstrates how to:
1. Load transaction/log data
2. Create lag time and previous timestamp features
3. Calculate rolling statistics
4. Analyze lag patterns
5. Export results
"""

import pandas as pd
from lag_features import (
    create_lag_features,
    calculate_rolling_features,
    analyze_lag_patterns,
    export_features
)


def create_sample_data() -> pd.DataFrame:
    """Create sample transaction data for demonstration."""
    data = {
        "account": ["A", "A", "A", "A", "A", "B", "B", "B", "C", "C", "C", "C"],
        "ts": [
            "2025-10-11 14:00:00",
            "2025-10-11 14:35:20",
            "2025-10-11 16:10:05",
            "2025-10-11 18:45:30",
            "2025-10-12 09:15:00",
            "2025-10-11 09:00:00",
            "2025-10-11 10:30:00",
            "2025-10-11 15:20:00",
            "2025-10-11 11:00:00",
            "2025-10-11 11:05:00",
            "2025-10-11 11:10:00",
            "2025-10-11 13:00:00"
        ],
        "amount": [
            10000, -12500, -8000, 5000, -15000,
            200000, -50000, -30000,
            50000, -5000, -3000, 20000
        ],
        "transaction_type": [
            "deposit", "withdrawal", "withdrawal", "deposit", "withdrawal",
            "deposit", "withdrawal", "withdrawal",
            "deposit", "withdrawal", "withdrawal", "deposit"
        ]
    }
    return pd.DataFrame(data)


def main():
    print("=" * 80)
    print("Lag Feature Engineering Example")
    print("=" * 80)

    # 1. Create or load sample data
    print("\n1. Loading sample transaction data...")
    df = create_sample_data()
    print(f"   Loaded {len(df)} transactions for {df['account'].nunique()} accounts")
    print(f"\n   Sample data (first 5 rows):")
    print(df.head().to_string(index=False))

    # 2. Create lag features
    print("\n2. Creating lag features (previous timestamp, time differences, value lags)...")
    df_with_lags = create_lag_features(
        df,
        group_col="account",
        time_col="ts",
        value_cols=["amount"],
        lag_periods=[1, 2],
        timezone="Asia/Seoul"
    )

    print("\n   Features added:")
    print("   - prev_ts: Previous timestamp within account")
    print("   - lag_time: Time difference (timedelta)")
    print("   - lag_seconds, lag_minutes, lag_hours: Time difference in various units")
    print("   - amount_lag1, amount_lag2: Previous amount values (1 and 2 steps back)")

    print(f"\n   Result with lag features (showing key columns):")
    display_cols = ["account", "ts", "amount", "prev_ts", "lag_minutes", "amount_lag1"]
    print(df_with_lags[display_cols].to_string(index=False))

    # 3. Calculate rolling features
    print("\n3. Calculating rolling window statistics...")
    df_with_rolling = calculate_rolling_features(
        df_with_lags,
        group_col="account",
        value_col="amount",
        windows=[2, 3]
    )

    print("\n   Rolling features added (windows: 2, 3):")
    print("   - amount_rolling_mean_N: Rolling mean over N transactions")
    print("   - amount_rolling_std_N: Rolling standard deviation")
    print("   - amount_rolling_min_N, amount_rolling_max_N: Rolling min/max")

    rolling_cols = ["account", "ts", "amount", "amount_rolling_mean_2", "amount_rolling_mean_3"]
    print(f"\n   Sample rolling features:")
    print(df_with_rolling[rolling_cols].to_string(index=False))

    # 4. Analyze lag patterns
    print("\n4. Analyzing lag time patterns by account...")
    lag_analysis = analyze_lag_patterns(
        df_with_rolling,
        group_col="account",
        lag_col="lag_minutes"
    )

    print("\n   Lag time statistics (in minutes):")
    print(lag_analysis.to_string(index=False))

    # 5. Identify anomalies (optional)
    print("\n5. Identifying potential anomalies...")

    # Transactions with unusually short lag times (< 10 minutes)
    short_lags = df_with_rolling[
        (df_with_rolling["lag_minutes"].notna()) &
        (df_with_rolling["lag_minutes"] < 10)
    ]

    if not short_lags.empty:
        print(f"\n   Found {len(short_lags)} transactions with lag time < 10 minutes:")
        anomaly_cols = ["account", "ts", "amount", "lag_minutes"]
        print(short_lags[anomaly_cols].to_string(index=False))
    else:
        print("   No transactions with lag time < 10 minutes")

    # Transactions with large amount changes compared to previous
    df_with_rolling["amount_change"] = (
        df_with_rolling["amount"] - df_with_rolling["amount_lag1"]
    ).abs()

    large_changes = df_with_rolling[
        (df_with_rolling["amount_change"].notna()) &
        (df_with_rolling["amount_change"] > 100000)
    ]

    if not large_changes.empty:
        print(f"\n   Found {len(large_changes)} transactions with large amount changes (> 100,000):")
        change_cols = ["account", "ts", "amount", "amount_lag1", "amount_change"]
        print(large_changes[change_cols].to_string(index=False))
    else:
        print("   No transactions with large amount changes")

    # 6. Export results
    print("\n6. Exporting results...")
    export_features(df_with_rolling, "transaction_features.parquet", format="parquet")
    export_features(df_with_rolling, "transaction_features.csv", format="csv")
    export_features(lag_analysis, "lag_analysis_summary.csv", format="csv")

    print("\n" + "=" * 80)
    print("Feature engineering completed successfully!")
    print("=" * 80)

    # 7. Display final DataFrame info
    print("\n7. Final DataFrame summary:")
    print(f"   Total rows: {len(df_with_rolling)}")
    print(f"   Total columns: {len(df_with_rolling.columns)}")
    print(f"   Column names: {', '.join(df_with_rolling.columns.tolist())}")

    # 8. Show data types
    print("\n8. Feature data types:")
    print(df_with_rolling.dtypes.to_string())


def example_with_csv_file():
    """
    Example of loading data from CSV file.

    CSV format should have columns: account, ts, amount, ...
    """
    print("\nExample: Loading from CSV file")
    print("-" * 80)

    # Uncomment and modify the path to your CSV file
    # df = pd.read_csv("your_transactions.csv")

    # Or load with date parsing
    # df = pd.read_csv(
    #     "your_transactions.csv",
    #     parse_dates=["ts"],
    #     encoding="utf-8-sig"
    # )

    # Then apply lag features
    # df_with_features = create_lag_features(
    #     df,
    #     group_col="account",
    #     time_col="ts",
    #     value_cols=["amount", "balance"],
    #     timezone="Asia/Seoul"
    # )

    # export_features(df_with_features, "output_features.parquet")

    print("See code comments for CSV loading example")


if __name__ == "__main__":
    main()
    print("\n")
    example_with_csv_file()
