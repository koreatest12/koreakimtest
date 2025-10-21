from __future__ import annotations

from sqlalchemy import (
    MetaData,
    Table,
    Column,
    String,
    Integer,
    Numeric,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    text,
)

metadata = MetaData()


customers = Table(
    "customers",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("first_name", String(100), nullable=False),
    Column("last_name", String(100), nullable=False),
    Column("dob", Date, nullable=False),
    Column("email", String(255), nullable=False, unique=True),
    Column("phone", String(50), nullable=False),
    Column("address", String(255), nullable=False),
    Column("city", String(100), nullable=False),
    Column("state", String(100), nullable=True),
    Column("zip", String(20), nullable=True),
    Column("country", String(100), nullable=False),
    Column("segment", Enum("retail", "smb", "corporate", "wealth", name="segment_enum"), nullable=False),
    Column("created_at", DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")),
    Index("ix_customers_email", "email"),
)


accounts = Table(
    "accounts",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("customer_id", String(36), ForeignKey("customers.id"), nullable=False),
    Column("account_number", String(34), nullable=False, unique=True),
    Column("account_type", Enum("checking", "savings", "loan", "credit", name="account_type_enum"), nullable=False),
    Column("opened_at", DateTime, nullable=False),
    Column("closed_at", DateTime, nullable=True),
    Column("branch_code", String(20), nullable=False),
    Column("currency", String(3), nullable=False),
    Column("interest_rate", Numeric(6, 4), nullable=True),
    Column("current_balance", Numeric(18, 2), nullable=False),
    Index("ix_accounts_customer", "customer_id"),
)


transactions = Table(
    "transactions",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("account_id", String(36), ForeignKey("accounts.id"), nullable=False),
    Column("txn_time", DateTime, nullable=False),
    Column("amount", Numeric(18, 2), nullable=False),
    Column("txn_type", Enum(
        "deposit",
        "withdrawal",
        "payment",
        "fee",
        "interest",
        "transfer_in",
        "transfer_out",
        name="txn_type_enum",
    ), nullable=False),
    Column("merchant", String(255), nullable=True),
    Column("category", Enum("income", "expense", "transfer", "interest", "fees", name="category_enum"), nullable=False),
    Column("description", String(500), nullable=True),
    Index("ix_txn_account", "account_id"),
    Index("ix_txn_time", "txn_time"),
)
