class ExecutionError(RuntimeError):
    pass


class DuplicateExecutionError(ExecutionError):
    pass


class BrokerSubmissionUnknownError(ExecutionError):
    pass


class BrokerOrderRejectedError(ExecutionError):
    pass


class InvalidOrderStateTransition(ExecutionError):
    pass


class FinancialStateUncertainError(ExecutionError):
    pass
