"""Built-in strategy templates."""
from .mean_reversion import MeanReversionStrategy
from .momentum import MomentumStrategy
from .scalping import ScalpingStrategy
from .swing import SwingStrategy

__all__ = [
    "ScalpingStrategy",
    "SwingStrategy",
    "MeanReversionStrategy",
    "MomentumStrategy",
]
