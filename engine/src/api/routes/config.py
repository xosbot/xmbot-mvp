from __future__ import annotations

import logging

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
    account_id: str | None = None
    server: str | None = None
    mt5_path: str | None = None
    mt5_login: int | None = None
    mt5_password: str | None = None
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
    telegram_chat_id: str | None = None
    broker: BrokerConfig
    risk: RiskConfig
    agents: list[AgentConfigModel]
    enable_ai_analysis: bool = True


class UserConfigUpdate(BaseModel):
    broker: BrokerConfig | None = None
    risk: RiskConfig | None = None
    agents: list[AgentConfigModel] | None = None
    telegram_chat_id: str | None = None
    enable_ai_analysis: bool | None = None


def _live_params(engine_ref, agent_name: str) -> dict | None:
    """Read a running agent's actual live parameter values, if it exposes any."""
    if engine_ref is None:
        return None
    live_agent = engine_ref.agents.get(agent_name)
    param_types = getattr(live_agent, "_PARAM_TYPES", None)
    if not param_types:
        return None
    return {k: getattr(live_agent, k) for k in param_types if hasattr(live_agent, k)}


def _to_out(user_id: str) -> UserConfigOut:
    cfg = _get_or_create(user_id)

    from ..server import engine_ref

    agents = []
    for name, ac in cfg.agent_configs.items():
        agents.append(AgentConfigModel(
            agent_type=name,
            enabled=ac.enabled,
            market=ac.markets[0] if ac.markets else "XAUUSD",
            timeframe=ac.timeframe,
            confidence_threshold=ac.confidence_threshold,
            params=_live_params(engine_ref, name) or ac.metadata,
        ))

    # Surface agents that are running but have never been PUT through this
    # config API yet, so a tuning UI has real values to show on first load.
    if engine_ref is not None:
        for name, live_agent in engine_ref.agents.items():
            if name in cfg.agent_configs:
                continue
            params = _live_params(engine_ref, name)
            if params is None:
                continue
            agents.append(AgentConfigModel(
                agent_type=name,
                enabled=True,
                market=live_agent.config.markets[0] if live_agent.config.markets else "XAUUSD",
                timeframe=live_agent.config.timeframe,
                confidence_threshold=live_agent.config.confidence_threshold,
                params=params,
            ))

    current_broker = engine_ref.config.default_broker if engine_ref else "paper"

    return UserConfigOut(
        user_id=user_id,
        telegram_chat_id=cfg.telegram_chat_id,
        broker=BrokerConfig(broker=current_broker),
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

    if body.agents:
        from ..server import engine_ref

        for a in body.agents:
            if not a.params:
                continue
            if engine_ref is None:
                raise HTTPException(status_code=503, detail="Engine not ready")
            try:
                engine_ref.update_agent_params(a.agent_type, a.params)
            except KeyError as e:
                raise HTTPException(status_code=404, detail=str(e))
            except (TypeError, ValueError) as e:
                raise HTTPException(status_code=400, detail=str(e))

    if body.broker is not None:
        from ..server import engine_ref

        if engine_ref is None:
            raise HTTPException(status_code=503, detail="Engine not ready")
        try:
            engine_ref.switch_broker(body.broker.broker)
        except RuntimeError as e:
            raise HTTPException(status_code=409, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    log.info(f"Config updated for {user_id}")
    return _to_out(user_id)


@router.post("/telegram/{user_id}")
async def register_telegram(user_id: str, chat_id: str):
    cfg = _get_or_create(user_id)
    cfg.telegram_chat_id = chat_id
    _config_store[user_id] = cfg
    return {"status": "ok", "telegram_chat_id": chat_id}
