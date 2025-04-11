from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from typing import Any, Optional

class ElementLocator:
    """Handles element location strategies."""
    def __init__(self, driver):
        self.driver = driver

    def find_element(self, strategy: str, locator: str, timeout: int = 10) -> Optional[Any]:
        """Find element using a specific strategy."""
        if not self.driver:
            raise ValueError("WebDriver not initialized")
        
        if not locator:  # Skip empty locators
            return None

        try:
            by_method = getattr(By, strategy.upper())
            return WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((by_method, locator))
            )
        except Exception:
            return None