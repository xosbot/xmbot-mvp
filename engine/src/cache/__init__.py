from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import time
from collections import OrderedDict
from dataclasses import dataclass, field
from typing import Any, Callable

log = logging.getLogger("xmbot.cache")


@dataclass
class CacheEntry:
    """A single cache entry."""

    key: str
    value: Any
    created_at: float = field(default_factory=time.time)
    ttl: float = 300.0  # 5 minutes default
    access_count: int = 0
    last_accessed: float = field(default_factory=time.time)

    @property
    def is_expired(self) -> bool:
        return time.time() - self.created_at > self.ttl

    @property
    def age(self) -> float:
        return time.time() - self.created_at

    def touch(self) -> None:
        """Update access statistics."""
        self.access_count += 1
        self.last_accessed = time.time()


class LRUCache:
    """Least Recently Used (LRU) cache with TTL support."""

    def __init__(self, max_size: int = 1000, default_ttl: float = 300.0) -> None:
        self._max_size = max_size
        self._default_ttl = default_ttl
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Any | None:
        """Get a value from the cache."""
        entry = self._cache.get(key)
        if entry is None:
            self._misses += 1
            return None

        if entry.is_expired:
            del self._cache[key]
            self._misses += 1
            return None

        # Move to end (most recently used)
        self._cache.move_to_end(key)
        entry.touch()
        self._hits += 1
        return entry.value

    def set(self, key: str, value: Any, ttl: float | None = None) -> None:
        """Set a value in the cache."""
        # Remove existing entry if present
        if key in self._cache:
            del self._cache[key]

        # Evict oldest if at capacity
        while len(self._cache) >= self._max_size:
            self._cache.popitem(last=False)

        self._cache[key] = CacheEntry(
            key=key,
            value=value,
            ttl=ttl or self._default_ttl,
        )

    def delete(self, key: str) -> bool:
        """Delete a value from the cache."""
        if key in self._cache:
            del self._cache[key]
            return True
        return False

    def clear(self) -> None:
        """Clear the entire cache."""
        self._cache.clear()
        self._hits = 0
        self._misses = 0

    def get_or_set(
        self, key: str, factory: Callable[[], Any], ttl: float | None = None
    ) -> Any:
        """Get a value from cache, or set it using factory if not found."""
        value = self.get(key)
        if value is not None:
            return value

        value = factory()
        self.set(key, value, ttl)
        return value

    async def get_or_set_async(
        self, key: str, factory: Callable[[], Any], ttl: float | None = None
    ) -> Any:
        """Async version of get_or_set."""
        value = self.get(key)
        if value is not None:
            return value

        # Check if factory is async
        if asyncio.iscoroutinefunction(factory):
            value = await factory()
        else:
            value = factory()

        self.set(key, value, ttl)
        return value

    def cleanup_expired(self) -> int:
        """Remove all expired entries. Returns count of removed entries."""
        expired_keys = [
            key for key, entry in self._cache.items()
            if entry.is_expired
        ]
        for key in expired_keys:
            del self._cache[key]
        return len(expired_keys)

    def get_stats(self) -> dict:
        """Get cache statistics."""
        total_requests = self._hits + self._misses
        hit_rate = (self._hits / total_requests * 100) if total_requests > 0 else 0

        return {
            "size": len(self._cache),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": round(hit_rate, 2),
            "total_requests": total_requests,
        }

    def keys(self) -> list[str]:
        """Get all cache keys."""
        return list(self._cache.keys())

    def values(self) -> list[Any]:
        """Get all cache values."""
        return [entry.value for entry in self._cache.values()]

    def __len__(self) -> int:
        return len(self._cache)

    def __contains__(self, key: str) -> bool:
        entry = self._cache.get(key)
        return entry is not None and not entry.is_expired


class CacheManager:
    """Manages multiple named caches."""

    def __init__(self) -> None:
        self._caches: dict[str, LRUCache] = {}
        self._default_max_size = 1000
        self._default_ttl = 300.0

    def get_cache(
        self, name: str, max_size: int | None = None, ttl: float | None = None
    ) -> LRUCache:
        """Get or create a named cache."""
        if name not in self._caches:
            self._caches[name] = LRUCache(
                max_size=max_size or self._default_max_size,
                default_ttl=ttl or self._default_ttl,
            )
        return self._caches[name]

    def delete_cache(self, name: str) -> bool:
        """Delete a named cache."""
        if name in self._caches:
            del self._caches[name]
            return True
        return False

    def clear_all(self) -> None:
        """Clear all caches."""
        for cache in self._caches.values():
            cache.clear()

    def get_all_stats(self) -> dict:
        """Get statistics for all caches."""
        stats = {}
        for name, cache in self._caches.items():
            stats[name] = cache.get_stats()
        return stats

    def cleanup_all(self) -> int:
        """Cleanup expired entries in all caches."""
        total = 0
        for cache in self._caches.values():
            total += cache.cleanup_expired()
        return total


# Global cache manager instance
_cache_manager: CacheManager | None = None


def get_cache_manager() -> CacheManager:
    """Get the global cache manager instance."""
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = CacheManager()
    return _cache_manager


def cache_key(*args: Any, **kwargs: Any) -> str:
    """Generate a cache key from arguments."""
    key_parts = [str(arg) for arg in args]
    key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
    raw_key = ":".join(key_parts)
    return hashlib.md5(raw_key.encode()).hexdigest()


def cached(
    ttl: float = 300.0,
    cache_name: str = "default",
    key_prefix: str = "",
):
    """Decorator for caching function results."""

    def decorator(func: Callable) -> Callable:
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            cache = get_cache_manager().get_cache(cache_name)
            key = f"{key_prefix}:{cache_key(*args, **kwargs)}"
            return cache.get_or_set(key, lambda: func(*args, **kwargs), ttl)

        wrapper.__name__ = func.__name__
        wrapper.__doc__ = func.__doc__
        return wrapper

    return decorator


def async_cached(
    ttl: float = 300.0,
    cache_name: str = "default",
    key_prefix: str = "",
):
    """Decorator for caching async function results."""

    def decorator(func: Callable) -> Callable:
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            cache = get_cache_manager().get_cache(cache_name)
            key = f"{key_prefix}:{cache_key(*args, **kwargs)}"
            return await cache.get_or_set_async(key, lambda: func(*args, **kwargs), ttl)

        wrapper.__name__ = func.__name__
        wrapper.__doc__ = func.__doc__
        return wrapper

    return decorator
