from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ...core.types import AgentConfig, UserConfig


log = logging.getLogger("xmbot.api.config")

router = APIRouter(prefix="/api/config", tags=["config"])

_config_store: dict[str, UserConfig] = {}


def _get_or_create(user_id: str) -> UserConfig:
    if user_id not in _config_store:
        _config_store[user_id] = UserConfig(user_id=user_id)
    return _config_store[user_id]


class BrokerConfig(BaseModel):
    broker: str = "paper"
    account_id: Optional[str] = None
    server: Optional[str] = None
    mt5_path: Optional[str] = None
    mt5_login: Optional[int] = None
    mt5_password: Optional[str] = None
    symbol: str = "XAUUSD"
    magic_number: int = 999001
    deviation: int = 20


class RiskConfig(BaseModel):
    max_daily_loss: float = 500.0
    max_drawdown_percent: float = 20.0
    max_position_size: float = 0.5
    default_stop_loss: float = 30.0


class AgentConfigModel(BaseModel):
    agent_type: str = "technical"
    enabled: bool = True
    market: str = "XAUUSD"
    timeframe: str = "H1"
    confidence_threshold: float = 0.7
    params: dict = {}


class UserConfigOut(BaseModel):
    user_id: str
    telegram_chat_id: Optional[str] = None
    broker: BrokerConfig
    risk: RiskConfig
    agents: list[AgentConfigModel]
    enable_ai_analysis: bool = True


class UserConfigUpdate(BaseModel):
    broker: Optional[BrokerConfig] = None
    risk: Optional[RiskConfig] = None
    agents: Optional[list[AgentConfigModel]] = None
    telegram_chat_id: Optional[str] = None
    enable_ai_analysis: Optional[bool] = None


def _to_out(user_id: str) -> UserConfigOut:
    cfg = _get_or_create(user_id)
    agents = []
    for name, ac in cfg.agent_configs.items():
        agents.append(AgentConfigModel(
            agent_type=name,
            enabled=ac.enabled,
            market=ac.markets[0] if ac.markets else "XAUUSD",
            timeframe=ac.timeframe,
            confidence_threshold=ac.confidence_threshold,
            params=ac.metadata,
        ))
    return UserConfigOut(
        user_id=user_id,
        telegram_chat_id=cfg.telegram_chat_id,
        broker=BrokerConfig(broker="paper"),
        risk=RiskConfig(
            max_daily_loss=cfg.max_daily_loss,
            max_drawdown_percent=cfg.max_drawdown_percent,
            max_position_size=cfg.max_position_size,
            default_stop_loss=cfg.default_stop_loss,
        ),
        agents=agents,
        enable_ai_analysis=cfg.enable_ai_analysis,
    )


def _apply_update(user_id: str, update: UserConfigUpdate) -> UserConfig:
    cfg = _get_or_create(user_id)

    if update.telegram_chat_id is not None:
        cfg.telegram_chat_id = update.telegram_chat_id

    if update.enable_ai_analysis is not None:
        cfg.enable_ai_analysis = update.enable_ai_analysis

    if update.risk:
        cfg.max_daily_loss = update.risk.max_daily_loss
        cfg.max_drawdown_percent = update.risk.max_drawdown_percent
        cfg.max_position_size = update.risk.max_position_size
        cfg.default_stop_loss = update.risk.default_stop_loss

    if update.agents:
        for a in update.agents:
            cfg.agent_configs[a.agent_type] = AgentConfig(
                name=a.agent_type,
                enabled=a.enabled,
                markets=[a.market],
                timeframe=a.timeframe,
                confidence_threshold=a.confidence_threshold,
                metadata=a.params,
            )

    _config_store[user_id] = cfg
    return cfg


@router.get("/{user_id}", response_model=UserConfigOut)
async def get_config(user_id: str):
    return _to_out(user_id)


@router.put("/{user_id}", response_model=UserConfigOut)
async def update_config(user_id: str, body: UserConfigUpdate):
    _apply_update(user_id, body)
    log.info(f"Config updated for {user_id}")
    return _to_out(user_id)


@router.post("/telegram/{user_id}")
async def register_telegram(user_id: str, chat_id: str):
    cfg = _get_or_create(user_id)
    cfg.telegram_chat_id = chat_id
    _config_store[user_id] = cfg
    return {"status": "ok", "telegram_chat_id": chat_id}
