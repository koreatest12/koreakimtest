from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

# Optional Teradata connector placeholder. Install 'teradatasql' separately if needed.

@dataclass(frozen=True)
class TeradataConfig:
    host: str
    user: str
    password: str
    database: Optional[str] = None
    logmech: Optional[str] = None  # e.g., TD2


def connect(cfg: TeradataConfig):  # pragma: no cover - optional path
    try:
        import teradatasql  # type: ignore
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError("teradatasql is not installed. Please install it to use Teradata.") from exc

    conn_str = {
        "host": cfg.host,
        "user": cfg.user,
        "password": cfg.password,
    }
    if cfg.database:
        conn_str["database"] = cfg.database
    if cfg.logmech:
        conn_str["logmech"] = cfg.logmech
    return teradatasql.connect(**conn_str)
