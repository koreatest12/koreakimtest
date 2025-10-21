from __future__ import annotations

import random
import uuid
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Iterable

import numpy as np
import pandas as pd
from faker import Faker


@dataclass(frozen=True)
class GenerationParams:
    num_customers: int
    min_accounts_per_customer: int = 1
    max_accounts_per_customer: int = 3
    avg_transactions_per_account: int = 200
    start_years_ago: int = 5
    seed: int | None = None


SEGMENTS = ["retail", "smb", "corporate", "wealth"]
ACCOUNT_TYPES = ["checking", "savings", "loan", "credit"]
CURRENCIES = ["USD", "EUR", "KRW", "JPY"]


def _rng(seed: int | None) -> random.Random:
    r = random.Random()
    if seed is not None:
        r.seed(seed)
        np.random.seed(seed)
    return r


def generate_customers(params: GenerationParams) -> pd.DataFrame:
    fake = Faker()
    # Ensure reproducibility and unique email generation
    if params.seed is not None:
        try:
            fake.seed_instance(params.seed)
        except Exception:
            # Fallback: global seed if instance seeding not available
            Faker.seed(params.seed)
    r = _rng(params.seed)
    rows = []
    for _ in range(params.num_customers):
        cid = str(uuid.uuid4())
        profile = fake.simple_profile()
        first_name = profile["name"].split(" ")[0]
        last_name = profile["name"].split(" ")[-1]
        dob = profile["birthdate"]
        if not isinstance(dob, date):
            dob = fake.date_of_birth(minimum_age=18, maximum_age=85)
        # Guarantee unique emails to satisfy UNIQUE constraint in schema
        email = fake.unique.email()
        phone = fake.phone_number()
        address = fake.street_address()
        city = fake.city()
        state = fake.state_abbr()
        zip_code = fake.postcode()
        country = fake.current_country()
        segment = r.choice(SEGMENTS)
        rows.append(
            {
                "id": cid,
                "first_name": first_name,
                "last_name": last_name,
                "dob": dob,
                "email": email,
                "phone": phone,
                "address": address,
                "city": city,
                "state": state,
                "zip": zip_code,
                "country": country,
                "segment": segment,
                "created_at": datetime.utcnow(),
            }
        )
    return pd.DataFrame(rows)


def _random_account_number(r: random.Random) -> str:
    # Simple IBAN-like number
    return "ACCT" + "".join(r.choice("0123456789") for _ in range(16))


def generate_accounts(customers: pd.DataFrame, params: GenerationParams) -> pd.DataFrame:
    r = _rng(params.seed)
    rows = []
    branches = [f"BR{n:03d}" for n in range(1, 51)]
    for _, cust in customers.iterrows():
        n_accts = r.randint(params.min_accounts_per_customer, params.max_accounts_per_customer)
        opened_base = datetime.utcnow() - timedelta(days=365 * params.start_years_ago)
        for _ in range(n_accts):
            aid = str(uuid.uuid4())
            atype = r.choice(ACCOUNT_TYPES)
            opened_at = opened_base + timedelta(days=r.randint(0, 365 * params.start_years_ago))
            interest_rate = round(r.uniform(0.0, 0.05), 4) if atype in ("savings", "loan", "credit") else None
            branch_code = r.choice(branches)
            currency = r.choice(CURRENCIES)
            rows.append(
                {
                    "id": aid,
                    "customer_id": cust["id"],
                    "account_number": _random_account_number(r),
                    "account_type": atype,
                    "opened_at": opened_at,
                    "closed_at": None,
                    "branch_code": branch_code,
                    "currency": currency,
                    "interest_rate": interest_rate,
                    "current_balance": 0.0,
                }
            )
    return pd.DataFrame(rows)


def generate_transactions(accounts: pd.DataFrame, params: GenerationParams) -> pd.DataFrame:
    r = _rng(params.seed)
    rows = []
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=365 * params.start_years_ago)

    avg_txn = max(1, params.avg_transactions_per_account)
    for _, acct in accounts.iterrows():
        # Poisson-like variability around average
        n_txn = int(np.random.poisson(lam=avg_txn))
        if n_txn < 1:
            n_txn = r.randint(1, 5)
        bal = 0.0
        for _ in range(n_txn):
            t = start_time + timedelta(seconds=r.randint(0, int((end_time - start_time).total_seconds())))
            txn_type = r.choices(
                population=["deposit", "withdrawal", "payment", "fee", "interest", "transfer_in", "transfer_out"],
                weights=[35, 35, 10, 5, 5, 5, 5],
                k=1,
            )[0]
            # Amounts vary by type
            base = {
                "deposit": r.uniform(50, 2000),
                "withdrawal": -r.uniform(20, 1000),
                "payment": -r.uniform(10, 2000),
                "fee": -r.uniform(1, 50),
                "interest": r.uniform(0.1, 50),
                "transfer_in": r.uniform(50, 2000),
                "transfer_out": -r.uniform(50, 2000),
            }[txn_type]
            amount = round(base, 2)
            category = (
                "income" if txn_type in ("deposit", "interest", "transfer_in") else
                "expense" if txn_type in ("withdrawal", "payment", "fee", "transfer_out") else
                "transfer"
            )
            rows.append(
                {
                    "id": str(uuid.uuid4()),
                    "account_id": acct["id"],
                    "txn_time": t,
                    "amount": amount,
                    "txn_type": txn_type,
                    "merchant": None,
                    "category": category if category in ("income", "expense") else "transfer",
                    "description": None,
                }
            )
            bal += amount
        # Update account balance
        # We'll recalc after loading, but carry here too for convenience
    df = pd.DataFrame(rows)
    return df
