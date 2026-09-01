# Broker adapter execution capabilities

Sprint 2 enables the durable idempotent execution path for the PaperBroker only.
Real adapters fail closed before submission until their client-ID lookup and
execution-history behavior is implemented and verified against broker sandboxes.

| Capability | Paper | Binance Spot | Binance Futures | MT5 | IBKR |
| --- | --- | --- | --- | --- | --- |
| Stable client ID accepted | Yes | Not integrated | Not integrated | Not integrated | Not integrated |
| Lookup by client ID | Yes | Not integrated | Not integrated | Not integrated | Not integrated |
| Normalized order snapshot | Yes | No | No | No | No |
| Independent fill history | Yes | No | No | No | No |
| Fees/commission normalized | Zero-cost simulation | No | No | No | No |
| Approved for durable live execution | Paper only | **No** | **No** | **No** | **No** |

“Not integrated” is not a statement about the broker's native API. It means the
XMBot adapter does not yet meet the safe uncertainty-recovery contract. These
adapters must not be enabled for live submission through `ExecutionService`.
