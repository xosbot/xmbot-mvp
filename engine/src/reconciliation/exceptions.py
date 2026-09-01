class ReconciliationError(RuntimeError):
    pass


class CriticalReconciliationMismatch(ReconciliationError):
    pass


class StartupReconciliationError(ReconciliationError):
    pass
