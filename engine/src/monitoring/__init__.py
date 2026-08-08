from __future__ import annotations

import logging
import time
from collections import deque
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any

log = logging.getLogger("xmbot.monitoring")


class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class MetricType(Enum):
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"


@dataclass
class Alert:
    """An alert record."""

    alert_id: str
    severity: AlertSeverity
    message: str
    source: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))
    resolved: bool = False
    resolved_at: datetime | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "alert_id": self.alert_id,
            "severity": self.severity.value,
            "message": self.message,
            "source": self.source,
            "timestamp": self.timestamp.isoformat(),
            "resolved": self.resolved,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "metadata": self.metadata,
        }


@dataclass
class Metric:
    """A metric data point."""

    name: str
    value: float
    metric_type: MetricType
    timestamp: float = field(default_factory=time.time)
    labels: dict[str, str] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "value": self.value,
            "type": self.metric_type.value,
            "timestamp": self.timestamp,
            "labels": self.labels,
        }


@dataclass
class HealthCheck:
    """Health check result."""

    name: str
    status: str
    message: str
    latency_ms: float = 0.0
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "status": self.status,
            "message": self.message,
            "latency_ms": self.latency_ms,
            "timestamp": self.timestamp.isoformat(),
        }


class MetricsCollector:
    """Collects and stores metrics."""

    def __init__(self, max_history: int = 1000) -> None:
        self._metrics: dict[str, deque[Metric]] = {}
        self._max_history = max_history
        self._counters: dict[str, float] = {}
        self._gauges: dict[str, float] = {}

    def record_counter(self, name: str, value: float = 1.0, labels: dict[str, str] | None = None) -> None:
        """Record a counter metric."""
        key = self._make_key(name, labels)
        self._counters[key] = self._counters.get(key, 0) + value
        self._record_metric(name, self._counters[key], MetricType.COUNTER, labels)

    def record_gauge(self, name: str, value: float, labels: dict[str, str] | None = None) -> None:
        """Record a gauge metric."""
        key = self._make_key(name, labels)
        self._gauges[key] = value
        self._record_metric(name, value, MetricType.GAUGE, labels)

    def record_histogram(self, name: str, value: float, labels: dict[str, str] | None = None) -> None:
        """Record a histogram metric."""
        self._record_metric(name, value, MetricType.HISTOGRAM, labels)

    def _record_metric(
        self, name: str, value: float, metric_type: MetricType, labels: dict[str, str] | None
    ) -> None:
        if name not in self._metrics:
            self._metrics[name] = deque(maxlen=self._max_history)

        metric = Metric(
            name=name,
            value=value,
            metric_type=metric_type,
            labels=labels or {},
        )
        self._metrics[name].append(metric)

    def _make_key(self, name: str, labels: dict[str, str] | None) -> str:
        if not labels:
            return name
        label_str = ":".join(f"{k}={v}" for k, v in sorted(labels.items()))
        return f"{name}:{label_str}"

    def get_counter(self, name: str, labels: dict[str, str] | None = None) -> float:
        """Get current counter value."""
        key = self._make_key(name, labels)
        return self._counters.get(key, 0)

    def get_gauge(self, name: str, labels: dict[str, str] | None = None) -> float:
        """Get current gauge value."""
        key = self._make_key(name, labels)
        return self._gauges.get(key, 0)

    def get_metrics(self, name: str) -> list[Metric]:
        """Get all metrics for a name."""
        return list(self._metrics.get(name, []))

    def get_all_counters(self) -> dict[str, float]:
        """Get all counter values."""
        return dict(self._counters)

    def get_all_gauges(self) -> dict[str, float]:
        """Get all gauge values."""
        return dict(self._gauges)

    def clear(self) -> None:
        """Clear all metrics."""
        self._metrics.clear()
        self._counters.clear()
        self._gauges.clear()


class AlertManager:
    """Manages alerts and notifications."""

    def __init__(self, max_alerts: int = 1000) -> None:
        self._alerts: deque[Alert] = deque(maxlen=max_alerts)
        self._alert_rules: dict[str, dict] = {}
        self._alert_id_counter = 0
        self._callbacks: list[Callable[[Alert], None]] = []

    def register_callback(self, callback: Callable[[Alert], None]) -> None:
        """Register an alert callback."""
        self._callbacks.append(callback)

    def create_alert(
        self,
        severity: AlertSeverity,
        message: str,
        source: str,
        metadata: dict[str, Any] | None = None,
    ) -> Alert:
        """Create a new alert."""
        self._alert_id_counter += 1
        alert = Alert(
            alert_id=f"alert_{self._alert_id_counter}",
            severity=severity,
            message=message,
            source=source,
            metadata=metadata or {},
        )
        self._alerts.append(alert)

        # Notify callbacks
        for callback in self._callbacks:
            try:
                callback(alert)
            except Exception as e:
                log.error(f"Alert callback failed: {e}")

        # Log based on severity
        if severity == AlertSeverity.CRITICAL:
            log.critical(f"ALERT [{source}]: {message}")
        elif severity == AlertSeverity.WARNING:
            log.warning(f"ALERT [{source}]: {message}")
        else:
            log.info(f"ALERT [{source}]: {message}")

        return alert

    def resolve_alert(self, alert_id: str) -> bool:
        """Resolve an alert."""
        for alert in self._alerts:
            if alert.alert_id == alert_id and not alert.resolved:
                alert.resolved = True
                alert.resolved_at = datetime.now(UTC)
                log.info(f"Resolved alert: {alert_id}")
                return True
        return False

    def get_active_alerts(self) -> list[Alert]:
        """Get all unresolved alerts."""
        return [a for a in self._alerts if not a.resolved]

    def get_alerts_by_severity(self, severity: AlertSeverity) -> list[Alert]:
        """Get alerts by severity."""
        return [a for a in self._alerts if a.severity == severity]

    def get_alert_count(self) -> int:
        """Get total alert count."""
        return len(self._alerts)

    def get_active_alert_count(self) -> int:
        """Get active alert count."""
        return len(self.get_active_alerts())

    def clear_resolved_alerts(self) -> int:
        """Clear all resolved alerts."""
        initial_count = len(self._alerts)
        self._alerts = deque(
            (a for a in self._alerts if not a.resolved),
            maxlen=self._alerts.maxlen,
        )
        return initial_count - len(self._alerts)


class HealthChecker:
    """Performs health checks on system components."""

    def __init__(self) -> None:
        self._checks: dict[str, Callable[[], HealthCheck]] = {}
        self._results: dict[str, HealthCheck] = {}

    def register_check(self, name: str, check_func: Callable[[], HealthCheck]) -> None:
        """Register a health check function."""
        self._checks[name] = check_func

    def run_check(self, name: str) -> HealthCheck | None:
        """Run a specific health check."""
        check_func = self._checks.get(name)
        if not check_func:
            return None

        start_time = time.time()
        try:
            result = check_func()
            result.latency_ms = (time.time() - start_time) * 1000
            self._results[name] = result
            return result
        except Exception as e:
            result = HealthCheck(
                name=name,
                status="error",
                message=str(e),
                latency_ms=(time.time() - start_time) * 1000,
            )
            self._results[name] = result
            return result

    def run_all_checks(self) -> dict[str, HealthCheck]:
        """Run all registered health checks."""
        for name in self._checks:
            self.run_check(name)
        return dict(self._results)

    def get_results(self) -> dict[str, HealthCheck]:
        """Get all health check results."""
        return dict(self._results)

    def is_healthy(self) -> bool:
        """Check if all health checks are passing."""
        return all(
            result.status == "ok"
            for result in self._results.values()
        )


class PerformanceMonitor:
    """Monitors system performance metrics."""

    def __init__(self) -> None:
        self._metrics = MetricsCollector()
        self._alerts = AlertManager()
        self._health = HealthChecker()
        self._start_time = time.time()
        self._request_count = 0
        self._error_count = 0

    def record_request(self, endpoint: str, method: str, status_code: int, duration_ms: float) -> None:
        """Record an API request."""
        self._request_count += 1
        self._metrics.record_counter(
            "http_requests_total",
            labels={"endpoint": endpoint, "method": method, "status": str(status_code)},
        )
        self._metrics.record_histogram(
            "http_request_duration_ms", duration_ms, labels={"endpoint": endpoint, "method": method}
        )

        if status_code >= 500:
            self._error_count += 1
            self._metrics.record_counter(
                "http_errors_total", labels={"endpoint": endpoint, "status": str(status_code)}
            )

    def record_trade(self, broker: str, symbol: str, success: bool) -> None:
        """Record a trade execution."""
        self._metrics.record_counter(
            "trades_total", labels={"broker": broker, "symbol": symbol, "success": str(success)}
        )

    def record_price(self, symbol: str, price: float) -> None:
        """Record a price update."""
        self._metrics.record_gauge("last_price", price, labels={"symbol": symbol})

    def record_user_action(self, user_id: str, action: str) -> None:
        """Record a user action."""
        self._metrics.record_counter("user_actions_total", labels={"user_id": user_id, "action": action})

    def get_metrics(self) -> MetricsCollector:
        """Get the metrics collector."""
        return self._metrics

    def get_alerts(self) -> AlertManager:
        """Get the alert manager."""
        return self._alerts

    def get_health(self) -> HealthChecker:
        """Get the health checker."""
        return self._health

    def get_system_stats(self) -> dict:
        """Get system statistics."""
        uptime = time.time() - self._start_time
        return {
            "uptime_seconds": uptime,
            "total_requests": self._request_count,
            "total_errors": self._error_count,
            "error_rate": (self._error_count / self._request_count * 100) if self._request_count > 0 else 0,
            "active_alerts": self._alerts.get_active_alert_count(),
            "healthy": self._health.is_healthy(),
        }


# Global performance monitor instance
_monitor: PerformanceMonitor | None = None


def get_monitor() -> PerformanceMonitor:
    """Get the global performance monitor instance."""
    global _monitor
    if _monitor is None:
        _monitor = PerformanceMonitor()
    return _monitor
