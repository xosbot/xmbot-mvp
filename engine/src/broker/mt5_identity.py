from __future__ import annotations

import hashlib
import re

MT5_COMMENT_MAX_LENGTH = 31
_PREFIX = "XMB-"


def encode_mt5_order_identity(client_order_id: str) -> str:
    """Encode a stable XMBot ID into MT5's short broker-visible comment."""
    digest = hashlib.sha256(client_order_id.encode()).hexdigest()[:24]
    return f"{_PREFIX}{digest}"[:MT5_COMMENT_MAX_LENGTH]


def is_xmbot_mt5_identity(comment: str | None) -> bool:
    return bool(comment and re.fullmatch(r"XMB-[0-9a-f]{24}", comment))


def mt5_identity_matches(comment: str | None, client_order_id: str) -> bool:
    return comment == encode_mt5_order_identity(client_order_id)
