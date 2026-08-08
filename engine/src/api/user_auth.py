from __future__ import annotations

import hashlib
import hmac

from fastapi import Request

USER_ID_HEADER = "X-User-Id"
USER_SIGNATURE_HEADER = "X-User-Signature"
ANONYMOUS = "anonymous"


def sign_user_id(user_id: str, secret: str) -> str:
    return hmac.new(secret.encode(), user_id.encode(), hashlib.sha256).hexdigest()


def verified_user_id(request: Request, secret: str) -> str:
    """Return the caller's user id, but only if it's signed with our shared secret.

    X-User-Id alone is just a client-supplied header — trusting it outright
    means anyone who can reach this API can read or act on any other user's
    trades/positions by setting the header. The Next.js backend is the only
    intended caller and signs the header with XMBOT_API_KEY (the same secret
    already required for x-api-key), so we verify that signature here rather
    than relying solely on the engine's network isolation to keep this safe.
    """
    user_id = request.headers.get(USER_ID_HEADER, "")
    signature = request.headers.get(USER_SIGNATURE_HEADER, "")
    if not user_id or not secret or not signature:
        return ANONYMOUS
    expected = sign_user_id(user_id, secret)
    if not hmac.compare_digest(expected, signature):
        return ANONYMOUS
    return user_id
