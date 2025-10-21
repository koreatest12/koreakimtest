from __future__ import annotations

import os
from typing import Dict

import pandas as pd
from sqlalchemy.engine import Engine

from .queries import get_queries


def run_reports(engine: Engine, output_dir: str) -> Dict[str, str]:
    os.makedirs(output_dir, exist_ok=True)
    dialect = engine.dialect.name
    queries = get_queries(dialect)
    outputs: Dict[str, str] = {}

    for name, sql in queries.items():
        df = pd.read_sql(sql, engine)
        out_path = os.path.join(output_dir, f"{name}.csv")
        df.to_csv(out_path, index=False)
        # Save the SQL as well
        with open(os.path.join(output_dir, f"{name}.sql"), "w", encoding="utf-8") as f:
            f.write(sql)
        outputs[name] = out_path
    return outputs
