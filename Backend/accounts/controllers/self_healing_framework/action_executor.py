from selenium.webdriver.support.ui import Select
from selenium.webdriver.remote.webelement import WebElement
from typing import Optional, Any
import logging

class ActionExecutor:
    """Handles execution of actions based on BDD steps."""
    def __init__(self, driver):
        self.driver = driver
        self.logger = logging.getLogger(__name__)

    def execute_action(self, element: WebElement, action: str, value: Optional[Any] = None) -> None:
        """Execute an action on the given element."""
        try:
            if action == "click":
                element.click()
            elif action == "input":
                element.clear()
                element.send_keys(value)
            elif action == "verify":
                if not element.is_displayed():
                    raise ValueError("Element is not visible")
            elif action == "select":
                Select(element).select_by_visible_text(value)
            elif action == "checkbox":
                if value == "check" and not element.is_selected():
                    element.click()
                elif value == "uncheck" and element.is_selected():
                    element.click()
            elif action == "radio":
                if not element.is_selected():
                    element.click()
            else:
                self.logger.warning(f"Unknown action: {action}")
        except Exception as e:
            self.logger.error(f"Failed to execute action '{action}': {str(e)}")
            raise