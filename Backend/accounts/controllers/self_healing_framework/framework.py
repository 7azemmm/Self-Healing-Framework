from selenium import webdriver
import time
import json
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
import logging
from concurrent.futures import ThreadPoolExecutor

from .element_locator import ElementLocator
from .element_healer import ElementHealer
from .mapping_loader import MappingLoader
from .action_executor import ActionExecutor
from .rl_healing_agent import RLHealingAgent
from .utils import determine_action, get_xpath
from .exceptions import ElementNotFoundError, HealingFailedError

class SelfHealingFramework:
    def __init__(self, mapping: str):
        self.driver = None
        self.mapping_loader = MappingLoader(mapping)
        self.mappings = self.mapping_loader.load_mappings()
        self.healing_history = {}
        self.rl_agent = RLHealingAgent(['id', 'CSS Selector', 'XPath (Absolute)', 'xpath_contains'])
        self.element_cache = {}
        self.element_locator = ElementLocator(self.driver)
        self.element_healer = ElementHealer()
        self.action_executor = ActionExecutor(self.driver)
        self.retry_attempts = 1
        self.logger = logging.getLogger(__name__)

    def execute_all_steps(self, delay: float = 1.5) -> None:
        """Automatically execute all BDD steps from the mapping."""
        for bdd_step, element_info in self.mappings.items():
            try:
                current_url = self.driver.current_url
                if current_url != element_info['Page']:
                    self.driver.get(element_info['Page'])
                    time.sleep(delay)
                
                action, value = determine_action(bdd_step)
                if action is None:
                    self.logger.warning(f"Could not determine action for step: {bdd_step}")
                    continue
                
                element = self.find_element(bdd_step)
                time.sleep(delay)
                self.action_executor.execute_action(element, action, value)
                
            except Exception as e:
                self.logger.error(f"Error executing step '{bdd_step}': {str(e)}")
                continue

    def start_browser(self, browser: str = "chrome") -> None:
        """Initialize the WebDriver."""
        if browser.lower() == "chrome":
            self.driver = webdriver.Chrome()
        elif browser.lower() == "firefox":
            self.driver = webdriver.Firefox()
        else:
            raise ValueError(f"Unsupported browser: {browser}")
        
        self.element_locator.driver = self.driver
        self.action_executor.driver = self.driver

    def find_element(self, bdd_step: str, timeout: int = 10) -> Any:
        """Find element using BDD step with self-healing capabilities."""
        if bdd_step not in self.mappings:
            raise InvalidBDDStepError(f"BDD step '{bdd_step}' not found in mappings")
        
        # Check cache first
        if bdd_step in self.element_cache:
            return self.element_cache[bdd_step]

        element_info = self.mappings[bdd_step]
        element = None

        for attempt in range(self.retry_attempts):
            try:
                element = self._find_with_healing(element_info, timeout)
                if element:
                    break
            except Exception as e:
                self.logger.warning(f"Attempt {attempt + 1} failed for '{bdd_step}': {str(e)}")
                time.sleep(1)

        if element:
            self._record_successful_find(bdd_step, element_info)
            self.element_cache[bdd_step] = element
            return element
        else:
            self._record_failed_find(bdd_step, element_info)
            raise ElementNotFoundError(f"Could not locate element for step: {bdd_step}")

    def _find_with_healing(self, element_info: Dict, timeout: int) -> Any:
        """Find element with multiple strategies and self-healing."""
        with ThreadPoolExecutor() as executor:
            futures = {
                executor.submit(
                    self.element_locator.find_element, 
                    strategy, 
                    locator, 
                    timeout
                ): strategy 
                for strategy, locator in element_info['locator_strategies'].items() 
                if locator
            }

            for future in futures:
                element = future.result()
                if element:
                    strategy_used = futures[future]
                    self.rl_agent.update_q_table(strategy_used, 1)  # Reward successful strategy
                    return element

        # If all strategies fail, attempt healing
        return self._heal_element(element_info)

    def _heal_element(self, element_info: Dict) -> Any:
        """Attempt to heal a broken element locator."""
        try:
            original_attributes = self._get_original_attributes(element_info)
            page_elements = self._get_all_page_elements()

            best_match = self.element_healer.heal_element(original_attributes, page_elements)
            if best_match:
                self._update_locator_strategies(element_info, best_match)
                return best_match['element']
            
            raise HealingFailedError("Element healing failed - no suitable match found")
        except Exception as e:
            self.logger.error(f"Element healing failed: {str(e)}")
            raise HealingFailedError(f"Element healing failed: {str(e)}")

    def _get_original_attributes(self, element_info: Dict) -> Dict:
        """Get original element attributes from stored information."""
        return {
            'id': element_info['ID'],
            'tag_name': element_info.get('tag_name', ''),
            'class_name': element_info.get('class_name', ''),
            'text': element_info.get('text', ''),
            'type': element_info.get('type', ''),
            'name': element_info.get('name', '')
        }

    def _update_locator_strategies(self, element_info: Dict, new_element: Dict) -> None:
        """Update stored locator strategies with new information."""
        new_id = new_element['attributes']['id']
        new_xpath = new_element['attributes'].get('xpath', '')
        
        new_strategies = self.mapping_loader._generate_locator_strategies(
            element_id=new_id,
            css=f"#{new_id}" if new_id else '',
            xpath=new_xpath,
            full_xpath=new_xpath
        )

        self.healing_history[element_info['ID']] = {
            'timestamp': datetime.now().isoformat(),
            'original_strategies': element_info['locator_strategies'].copy(),
            'new_strategies': new_strategies,
            'matched_attributes': new_element['attributes'],
            'note': "Element was healed using semantic matching"
        }

        element_info['locator_strategies'] = new_strategies

    def _record_successful_find(self, bdd_step: str, element_info: Dict) -> None:
        """Record successful element location."""
        self.logger.info(f"Successfully located element for step: {bdd_step}")

    def _record_failed_find(self, bdd_step: str, element_info: Dict) -> None:
        """Record failed element location with a screenshot."""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        screenshot_path = f"screenshots/failure_{timestamp}.png"
        self.driver.save_screenshot(screenshot_path)
        self.logger.error(f"Failed to locate element for step: {bdd_step}. Screenshot saved to {screenshot_path}")

    def _get_all_page_elements(self) -> list:
        """Get all elements from the current page with their attributes."""
        elements = []
        for element in self.driver.find_elements(By.XPATH, "//*"):
            try:
                tag_name = element.tag_name.lower()
                if tag_name in ['label', 'div', 'span']:  # Skip common non-interactive elements
                    continue

                xpath = get_xpath(element)

                element_data = {
                    'element': element,
                    'attributes': {
                        'id': element.get_attribute('id') or '',
                        'tag_name': element.tag_name,
                        'class_name': element.get_attribute('class') or '',
                        'text': element.text or '',
                        'type': element.get_attribute('type') or '',
                        'name': element.get_attribute('name') or '',
                        'xpath': xpath
                    }
                }
                elements.append(element_data)
            except Exception as e:
                self.logger.warning(f"Could not get attributes for element: {str(e)}")
                continue
        return elements

    def get_healing_report(self) -> str:
        """Generate report of all healing actions."""
        if not self.healing_history:
            return json.dumps({"message": "No healing actions were performed"}, indent=2)
        return json.dumps(self.healing_history, indent=2)

    def close(self) -> None:
        """Clean up resources."""
        if self.driver:
            self.driver.quit()
            self.driver = None