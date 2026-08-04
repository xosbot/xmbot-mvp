"""Built-in strategy templates."""
from .scalping import ScalpingStrategy
from .swing import SwingStrategy
from .mean_reversion import MeanReversionStrategy
from .momentum import MomentumStrategy

__all__ = [
    "ScalpingStrategy",
    "SwingStrategy",
    "MeanReversionStrategy",
    "MomentumStrategy",
]
