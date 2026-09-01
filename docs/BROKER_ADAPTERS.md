# Broker adapter execution capabilities

PaperBroker remains the only generally enabled durable adapter. Sprint 3 adds an
MT5 implementation for deterministic comment identity, active/history order
lookup, deal normalization, and position/account reads. MT5 still defaults to
fail-closed until an operator explicitly enables it after the demo procedure.

| Capability | Paper | Binance Spot | Binance Futures | MT5 | IBKR |
| --- | --- | --- | --- | --- | --- |
| Stable XMBot identity | Yes | No | No | Implemented via magic/comment | No |
| Lookup by client ID | Yes | No | No | Active orders + 30-day order/deal history | No |
| Normalized order snapshot | Yes | No | No | Implemented; unknown state stays `UNKNOWN` | No |
| Independent fill history | Yes | No | No | MT5 deals normalized | No |
| Profit/cost normalization | Zero-cost simulation | No | No | profit + signed commission/swap/fee | No |
| Position reconciliation | Basic | No | No | Detection implemented; closure finalization incomplete | No |
| Approved for durable live execution | Paper only | **No** | **No** | **No — demo verification required** | **No** |

“Not integrated” is not a statement about the broker's native API. It means the
XMBot adapter does not yet meet the safe uncertainty-recovery contract. These
adapters must not be enabled for live submission through `ExecutionService`.
MT5's `idempotency_verified` constructor flag defaults to false and must never
be enabled merely because unit tests pass.
