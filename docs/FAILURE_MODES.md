# Financial execution failure modes

| Failure | Current safe response |
| --- | --- |
| Database fails before intent commit | No broker call |
| Duplicate execution request | Atomic intent claim; no second submission |
| Submission response lost | `SUBMISSION_UNKNOWN`; lookup; no blind retry |
| Broker lookup unsupported | Fail closed |
| MT5 order state unknown | `UNKNOWN`, then reconciliation required |
| Unknown broker order/position | Ledger mismatch; account `UNSAFE` |
| Position disappears | `RECONCILIATION_REQUIRED`; no guessed P&L |
| MT5 history unavailable | Reconciliation unsafe; no new trade |
| Startup reconciliation unsafe | Engine does not start agent loops |
| Duplicate external MT5 deal | Database uniqueness per broker account/deal |

Still incomplete: automated closure finalization from multiple exit deals,
durable reconciliation resolution records tied to stable mismatch IDs, deal
watermarks, and fully tested crash recovery on a real MT5 demo terminal.
