import pytest

from src.core.config import ConfigurationError, EngineConfig


def test_development_allows_incomplete_configuration() -> None:
    EngineConfig(env="development").validate_for_startup("paper")


def test_production_requires_security_boundaries() -> None:
    with pytest.raises(ConfigurationError, match="XMBOT_API_KEY, DATABASE_URL, ENCRYPTION_KEY"):
        EngineConfig(env="production").validate_for_startup("mt5")


def test_production_rejects_paper_broker() -> None:
    config = EngineConfig(
        env="production",
        api_key="service-key",
        database_url="postgresql://database/xmbot",
        encryption_key="encryption-key",
    )

    with pytest.raises(ConfigurationError, match="cannot use the paper broker"):
        config.validate_for_startup("paper")


def test_production_accepts_mt5_with_security_boundaries() -> None:
    config = EngineConfig(
        env="production",
        api_key="service-key",
        database_url="postgresql://database/xmbot",
        encryption_key="encryption-key",
    )

    config.validate_for_startup("mt5")


def test_unknown_broker_is_rejected_in_every_environment() -> None:
    with pytest.raises(ConfigurationError, match="Unsupported broker"):
        EngineConfig().validate_for_startup("unknown")
