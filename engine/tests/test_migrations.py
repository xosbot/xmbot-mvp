from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


def test_financial_migration_upgrades_and_downgrades(tmp_path: Path) -> None:
    database_path = tmp_path / "migration.db"
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", f"sqlite:///{database_path}")

    command.upgrade(config, "head")

    inspector = inspect(create_engine(f"sqlite:///{database_path}"))
    expected = {
        "broker_accounts",
        "broker_orders",
        "executions",
        "financial_positions",
        "ledger_events",
        "order_intents",
        "trade_approvals",
        "trading_signals",
    }
    assert expected <= set(inspector.get_table_names())
    order_intent_uniques = inspector.get_unique_constraints("order_intents")
    assert any(item["column_names"] == ["client_order_id"] for item in order_intent_uniques)

    command.downgrade(config, "base")
    inspector = inspect(create_engine(f"sqlite:///{database_path}"))
    assert not expected & set(inspector.get_table_names())
