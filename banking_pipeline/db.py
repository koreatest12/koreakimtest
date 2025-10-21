from __future__ import annotations

from typing import Optional

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

from .config import DbConfig


def make_sqlalchemy_url(cfg: DbConfig) -> str:
    if cfg.target == "postgres":
        return f"postgresql+psycopg://{cfg.user}:{cfg.password}@{cfg.host}:{cfg.port}/{cfg.database}"
    if cfg.target in ("mysql", "mariadb"):
        driver = "mysql+pymysql"
        return f"{driver}://{cfg.user}:{cfg.password}@{cfg.host}:{cfg.port}/{cfg.database}"
    if cfg.target == "sqlite":
        path = cfg.sqlite_path or "artifacts/sqlite_bank.db"
        return f"sqlite:///{path}"
    if cfg.target == "duckdb":
        path = cfg.duckdb_path or "artifacts/duckdb_bank.duckdb"
        return f"duckdb:///{path}"
    raise ValueError(f"Unsupported target db: {cfg.target}")


def create_db_engine(cfg: DbConfig, echo: bool = False, pool_pre_ping: bool = True) -> Engine:
    url = make_sqlalchemy_url(cfg)
    return create_engine(url, echo=echo, pool_pre_ping=pool_pre_ping, future=True)
