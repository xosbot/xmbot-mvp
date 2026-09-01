"""complete Sprint 3 accounting and reconciliation state

Revision ID: 9ab3d6e14f20
Revises: 4c91c8e223ac
Create Date: 2026-09-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "9ab3d6e14f20"
down_revision: str | None = "4c91c8e223ac"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("executions") as batch:
        batch.add_column(sa.Column("risk_accounted_at", sa.DateTime(timezone=True)))
    op.create_index("ix_executions_risk_accounted_at", "executions", ["risk_accounted_at"])

    with op.batch_alter_table("financial_positions") as batch:
        batch.add_column(
            sa.Column("gross_realized_pnl", sa.Numeric(24, 8), nullable=False, server_default="0")
        )
        batch.add_column(
            sa.Column("commission", sa.Numeric(24, 8), nullable=False, server_default="0")
        )
        batch.add_column(sa.Column("swap", sa.Numeric(24, 8), nullable=False, server_default="0"))

    op.create_table(
        "reconciliation_cursors",
        sa.Column("broker_account_id", sa.String(36), primary_key=True),
        sa.Column("last_successful_at", sa.DateTime(timezone=True)),
        sa.Column("last_deal_id", sa.String(128)),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["broker_account_id"], ["broker_accounts.id"]),
    )
    op.create_table(
        "reconciliation_issues",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("broker_account_id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("mismatch_type", sa.String(64), nullable=False),
        sa.Column("severity", sa.String(16), nullable=False),
        sa.Column("symbol", sa.String(64)),
        sa.Column("internal_id", sa.String(128)),
        sa.Column("broker_id", sa.String(128)),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("detected_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True)),
        sa.Column("resolution_method", sa.Text()),
        sa.Column("payload_json", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["broker_account_id"], ["broker_accounts.id"]),
    )
    op.create_index("ix_reconciliation_issues_broker_account_id", "reconciliation_issues", ["broker_account_id"])
    op.create_index("ix_reconciliation_issues_user_id", "reconciliation_issues", ["user_id"])
    op.create_index("ix_reconciliation_issues_status", "reconciliation_issues", ["status"])
    op.create_index(
        "ix_reconciliation_issue_account_status",
        "reconciliation_issues",
        ["broker_account_id", "status"],
    )


def downgrade() -> None:
    op.drop_index("ix_reconciliation_issue_account_status", table_name="reconciliation_issues")
    op.drop_index("ix_reconciliation_issues_status", table_name="reconciliation_issues")
    op.drop_index("ix_reconciliation_issues_user_id", table_name="reconciliation_issues")
    op.drop_index("ix_reconciliation_issues_broker_account_id", table_name="reconciliation_issues")
    op.drop_table("reconciliation_issues")
    op.drop_table("reconciliation_cursors")
    with op.batch_alter_table("financial_positions") as batch:
        batch.drop_column("swap")
        batch.drop_column("commission")
        batch.drop_column("gross_realized_pnl")
    op.drop_index("ix_executions_risk_accounted_at", table_name="executions")
    with op.batch_alter_table("executions") as batch:
        batch.drop_column("risk_accounted_at")
