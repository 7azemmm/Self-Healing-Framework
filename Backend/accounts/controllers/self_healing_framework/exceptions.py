"""
Custom exceptions for the Self-Healing Framework.
"""

class ElementNotFoundError(Exception):
    """Raised when an element cannot be found even after healing attempts."""
    pass

class HealingFailedError(Exception):
    """Raised when the healing process fails to find a suitable replacement."""
    pass

class InvalidBDDStepError(Exception):
    """Raised when a BDD step is not found in the mappings."""
    pass

class ActionExecutionError(Exception):
    """Raised when an action cannot be executed on an element."""
    pass

class LocatorStrategyError(Exception):
    """Raised when all locator strategies fail to find an element."""
    pass