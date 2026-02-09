from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class DbConfig:
    target: str
    user: str | None
    password: str | None
    host: str | None
    port: int | None
    database: str | None
    sqlite_path: str | None
    duckdb_path: str | None


DEFAULTS = {
    "postgres": {"user": "postgres", "password": "postgres", "host": "localhost", "port": 5432, "database": "bank"},
    "mysql": {"user": "root", "password": "password", "host": "localhost", "port": 3306, "database": "bank"},
    "mariadb": {"user": "root", "password": "password", "host": "localhost", "port": 3307, "database": "bank"},
    "sqlite": {"sqlite_path": "artifacts/sqlite_bank.db"},
    "duckdb": {"duckdb_path": "artifacts/duckdb_bank.duckdb"},
}


def load_db_config(target: str) -> DbConfig:
    t = target.lower()
    if t not in DEFAULTS:
        raise ValueError(f"Unsupported target db: {target}")

    defaults = DEFAULTS[t]
    user = os.getenv("DB_USER", defaults.get("user"))
    password = os.getenv("DB_PASSWORD", defaults.get("password"))
    host = os.getenv("DB_HOST", defaults.get("host"))
    # Parse optional DB_PORT safely: treat missing/empty as None/default
    raw_port = os.getenv("DB_PORT")
    if raw_port is None or raw_port.strip() == "":
        port = defaults.get("port")
    else:
        try:
            port = int(raw_port) or None
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Invalid DB_PORT: {raw_port!r}") from exc
    database = os.getenv("DB_NAME", defaults.get("database"))
    sqlite_path = os.getenv("SQLITE_PATH", defaults.get("sqlite_path"))
    duckdb_path = os.getenv("DUCKDB_PATH", defaults.get("duckdb_path"))

    return DbConfig(
        target=t,
        user=user,
        password=password,
        host=host,
        port=port,
        database=database,
        sqlite_path=sqlite_path,
        duckdb_path=duckdb_path,
    )
