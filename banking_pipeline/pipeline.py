from __future__ import annotations

import argparse
import os
from typing import Tuple

import pandas as pd
from sqlalchemy import text

from .config import load_db_config
from .db import create_db_engine
from .schema import metadata, customers as t_customers, accounts as t_accounts, transactions as t_transactions
from .data_generator import GenerationParams, generate_customers, generate_accounts, generate_transactions
from .reporting import run_reports


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Synthetic banking data pipeline")
    p.add_argument("--target", required=True, choices=["postgres", "mysql", "mariadb", "sqlite", "duckdb"], help="Target database type")
    p.add_argument("--rows", type=int, default=10000, help="Approx number of transactions total (scaled by accounts)")
    p.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    p.add_argument("--out", type=str, default="artifacts", help="Output directory for reports")
    return p.parse_args()


def scale_params(total_rows: int) -> Tuple[int, int]:
    # Heuristic: 1/10 of rows are customers, ~2 accounts/person
    num_customers = max(50, total_rows // 10)
    avg_txn_per_account = max(50, total_rows // max(1, int(num_customers * 2)))
    return num_customers, avg_txn_per_account


def create_schema(engine) -> None:
    with engine.begin() as conn:
        metadata.drop_all(bind=conn)
        metadata.create_all(bind=conn)


def upsert_balances(engine) -> None:
    # Compute current balances from transactions per account and update accounts.current_balance
    dialect = engine.dialect.name
    if dialect in ("mysql", "mariadb"):
        # MySQL/MariaDB
        update_sql = """
            UPDATE accounts a
            JOIN (
                SELECT account_id, ROUND(SUM(amount), 2) AS bal
                FROM transactions
                GROUP BY account_id
            ) t ON t.account_id = a.id
            SET a.current_balance = t.bal
        """
    elif dialect == "sqlite":
        update_sql = """
            UPDATE accounts
            SET current_balance = (
                SELECT ROUND(COALESCE(SUM(amount), 0), 2)
                FROM transactions t
                WHERE t.account_id = accounts.id
            )
        """
    else:
        # Postgres, DuckDB
        update_sql = """
            UPDATE accounts AS a
            SET current_balance = t.bal
            FROM (
                SELECT account_id, ROUND(SUM(amount), 2) AS bal
                FROM transactions
                GROUP BY account_id
            ) AS t
            WHERE t.account_id = a.id
        """
    with engine.begin() as conn:
        conn.execute(text(update_sql))


def load_dataframe(df: pd.DataFrame, table_name: str, engine) -> None:
    df.to_sql(table_name, engine, if_exists="append", index=False, method=None, chunksize=1000)


def main() -> None:
    args = parse_args()
    cfg = load_db_config(args.target)
    engine = create_db_engine(cfg)

    os.makedirs(args.out, exist_ok=True)

    # 1) Schema
    create_schema(engine)

    # 2) Generate data
    num_customers, avg_txn_per_account = scale_params(args.rows)
    params = GenerationParams(
        num_customers=num_customers,
        avg_transactions_per_account=avg_txn_per_account,
        seed=args.seed,
    )
    df_customers = generate_customers(params)
    df_accounts = generate_accounts(df_customers, params)
    df_txn = generate_transactions(df_accounts, params)

    # 3) Load
    load_dataframe(df_customers, t_customers.name, engine)
    load_dataframe(df_accounts, t_accounts.name, engine)
    load_dataframe(df_txn, t_transactions.name, engine)

    # 4) Compute balances via SQL
    upsert_balances(engine)

    # 5) Reports
    out_dir = os.path.join(args.out, args.target)
    run_reports(engine, out_dir)

    print(f"Pipeline completed. Reports at: {out_dir}")


if __name__ == "__main__":
    main()
