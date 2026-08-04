"""API middleware for rate limiting and request tracking."""
from __future__ import annotations

import logging
import time
from collections import defaultdict
from datetime import UTC, datetime

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

log = logging.getLogger("xmbot.api.middleware")


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiter.

    Limits requests per client IP per minute. Returns 429 Too Many Requests
    when limit is exceeded.
    """

    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _cleanup_old_requests(self, client_ip: str, now: float) -> None:
        """Remove requests outside the current window."""
        cutoff = now - self.window_seconds
        self._requests[client_ip] = [
            t for t in self._requests[client_ip] if t > cutoff
        ]

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip rate limiting for health checks and docs
        if request.url.path in ("/health", "/docs", "/openapi.json", "/redoc"):
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        now = time.time()

        self._cleanup_old_requests(client_ip, now)

        if len(self._requests[client_ip]) >= self.max_requests:
            retry_after = int(self.window_seconds - (now - self._requests[client_ip][0]))
            log.warning(f"Rate limit exceeded for {client_ip}")
            return Response(
                content=f'{{"detail": "Rate limit exceeded. Try again in {retry_after}s"}}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": str(retry_after)},
            )

        self._requests[client_ip].append(now)
        response = await call_next(request)

        # Add rate limit headers
        remaining = self.max_requests - len(self._requests[client_ip])
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        response.headers["X-RateLimit-Reset"] = str(int(now + self.window_seconds))

        return response


class RequestTrackingMiddleware(BaseHTTPMiddleware):
    """Add request ID and timing headers to all responses."""

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.time()
        request_id = f"{int(start_time * 1000)}-{id(request)}"

        response = await call_next(request)

        process_time = time.time() - start_time
        response.headers["X-Request-ID"] = str(request_id)
        response.headers["X-Process-Time"] = f"{process_time:.4f}"

        return response
