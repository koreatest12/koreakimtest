from __future__ import annotations

from typing import Dict


def _month_expr(dialect: str, column: str) -> str:
    d = dialect
    if d in ("postgresql", "postgres"):
        return f"date_trunc('month', {column})"
    if d in ("mysql", "mariadb"):
        return f"date_format({column}, '%Y-%m-01 00:00:00')"
    if d == "sqlite":
        return f"strftime('%Y-%m-01 00:00:00', {column})"
    if d == "duckdb":
        return f"date_trunc('month', {column})"
    # Fallback ISO-like
    return f"{column}"


def _date_expr(dialect: str, column: str) -> str:
    d = dialect
    if d in ("postgresql", "postgres", "duckdb"):
        return f"CAST({column} AS DATE)"
    if d in ("mysql", "mariadb"):
        return f"DATE({column})"
    if d == "sqlite":
        return f"DATE({column})"
    return f"{column}"


def get_queries(dialect: str) -> Dict[str, str]:
    m = _month_expr(dialect, "txn_time")
    d = _date_expr(dialect, "txn_time")

    return {
        "monthly_income_statement": f"""
            SELECT {m} AS month,
                   SUM(CASE WHEN category = 'income' THEN amount ELSE 0 END) AS total_income,
                   SUM(CASE WHEN category = 'expense' THEN -amount ELSE 0 END) AS total_expense,
                   SUM(CASE WHEN category = 'income' THEN amount ELSE 0 END) -
                   SUM(CASE WHEN category = 'expense' THEN -amount ELSE 0 END) AS net_income
            FROM transactions
            GROUP BY {m}
            ORDER BY {m}
        """,
        "balances_by_branch_and_type": """
            SELECT a.branch_code,
                   a.account_type,
                   SUM(a.current_balance) AS total_balance,
                   COUNT(*) AS num_accounts
            FROM accounts a
            GROUP BY a.branch_code, a.account_type
            ORDER BY a.branch_code, a.account_type
        """,
        "customer_segment_counts": """
            SELECT c.segment,
                   COUNT(*) AS num_customers
            FROM customers c
            GROUP BY c.segment
            ORDER BY c.segment
        """,
        "transactions_daily_volume": f"""
            SELECT {d} AS day,
                   COUNT(*) AS txn_count,
                   SUM(amount) AS net_amount
            FROM transactions
            GROUP BY {d}
            ORDER BY day
        """,
    }
