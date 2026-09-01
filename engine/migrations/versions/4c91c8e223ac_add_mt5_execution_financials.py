"""add MT5 execution financials and external uniqueness

Revision ID: 4c91c8e223ac
Revises: 888e939179cd
Create Date: 2026-09-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "4c91c8e223ac"
down_revision: str | None = "888e939179cd"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("executions") as batch:
        batch.add_column(sa.Column("broker_account_id", sa.String(length=36)))
        batch.add_column(sa.Column("gross_profit", sa.Numeric(24, 8)))
        batch.add_column(sa.Column("swap", sa.Numeric(24, 8), nullable=False, server_default="0"))
        batch.add_column(sa.Column("position_id", sa.String(length=128)))
        batch.add_column(sa.Column("entry_type", sa.String(length=16)))
        batch.add_column(sa.Column("magic", sa.Integer()))
        batch.add_column(sa.Column("comment", sa.String(length=64)))
        batch.create_foreign_key(
            "fk_executions_broker_account",
            "broker_accounts",
            ["broker_account_id"],
            ["id"],
        )
        batch.create_unique_constraint(
            "uq_execution_account_external", ["broker_account_id", "broker_execution_id"]
        )
    op.create_index("ix_executions_broker_account_id", "executions", ["broker_account_id"])
    op.create_index("ix_executions_position_id", "executions", ["position_id"])


def downgrade() -> None:
    op.drop_index("ix_executions_position_id", table_name="executions")
    op.drop_index("ix_executions_broker_account_id", table_name="executions")
    with op.batch_alter_table("executions") as batch:
        batch.drop_constraint("uq_execution_account_external", type_="unique")
        batch.drop_constraint("fk_executions_broker_account", type_="foreignkey")
        for column in (
            "comment",
            "magic",
            "entry_type",
            "position_id",
            "swap",
            "gross_profit",
            "broker_account_id",
        ):
            batch.drop_column(column)
