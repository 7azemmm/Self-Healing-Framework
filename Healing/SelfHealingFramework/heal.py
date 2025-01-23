from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
import pandas as pd
import logging
from datetime import datetime
import json
import re
import time
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from sentence_transformers import SentenceTransformer, util
from symspellpy import SymSpell

# Set up logging configuration
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class RLHealingAgent:
    """Reinforcement  agent for strategy selection."""
    def __init__(self, strategies):
        self.strategies = strategies
        self.q_table = np.zeros((len(strategies), 1))  # Q-table for strategy selection
        self.learning_rate = 0.1
        self.discount_factor = 0.9
        self.epsilon = 0.1  # Exploration rate

    def choose_strategy(self):
        """Choose a strategy using epsilon-greedy policy."""
        if np.random.uniform(0, 1) < self.epsilon:
            return np.random.choice(self.strategies)  # Explore
        else:
            return self.strategies[np.argmax(self.q_table)]  # Exploit

    def update_q_table(self, strategy, reward):
        """Update Q-table based on the reward."""
        strategy_index = self.strategies.index(strategy)
        self.q_table[strategy_index] += self.learning_rate * (reward - self.q_table[strategy_index])

class SelfHealingFramework:
    def __init__(self, mapping_file_path: str):
        self.driver = None
        self.logger = logger
        self.mappings = self._load_mappings(mapping_file_path)
        self.healing_history = {}
        self.similarity_model = SentenceTransformer('all-MiniLM-L6-v2')  # NLP model for semantic matching
        self.rl_agent = RLHealingAgent(['id', 'css', 'xpath', 'xpath_contains'])  # RL agent for strategy selection
        self.element_cache = {}  # Cache for frequently accessed elements
        self.sym_spell = SymSpell()  # Error correction for BDD steps
        self.sym_spell.load_dictionary('path/to/dictionary.txt', term_index=0, count_index=1)
        self.retry_attempts = 3  # Number of retry attempts for finding elements

    def _load_mappings(self, file_path: str) -> dict:
        """Load BDD step to element ID mappings from CSV."""
        df = pd.read_csv(file_path)
        mappings = {}
        for _, row in df.iterrows():
            bdd_step = row['BDD Step'].strip()
            element_id = row['element_id'].strip()
            mappings[bdd_step] = {
                'element_id': element_id,
                'locator_strategies': self._generate_locator_strategies(element_id)
            }
        return mappings

    def _generate_locator_strategies(self, element_id: str) -> dict:
        """Generate multiple locator strategies for an element."""
        return {
            'id': element_id,
            'css': f'#{element_id}',
            'xpath': f'//*[@id="{element_id}"]',
            'xpath_contains': f'//*[contains(@id, "{element_id}")]'
        }

    def execute_all_steps(self, delay=1.5):
        """Automatically execute all BDD steps from the CSV."""
        for bdd_step, element_info in self.mappings.items():
            action, value = self._determine_action(bdd_step)
            self.logger.info(f"Executing step: {bdd_step} - Action: {action}, Value: {value}")
            try:
                element = self.find_element(bdd_step)
                time.sleep(delay)
                if action == "click":
                    element.click()
                elif action == "input":
                    element.clear()
                    element.send_keys(value)
                elif action == "verify":
                    is_visible = element.is_displayed()
                    self.logger.info(f"Verification result for '{bdd_step}': {is_visible}")
                elif action == "select":
                    select = Select(element)
                    select.select_by_visible_text(value)
                    self.logger.info(f"Selected '{value}' in dropdown for '{bdd_step}'")
                elif action == "checkbox":
                    if value == "check" and not element.is_selected():
                        element.click()
                    elif value == "uncheck" and element.is_selected():
                        element.click()
                elif action == "radio":
                    if not element.is_selected():
                        element.click()
                        self.logger.info(f"Selected radio button for '{bdd_step}'")
                else:
                    self.logger.warning(f"Unrecognized action for step '{bdd_step}'")
            except Exception as e:
                self.logger.error(f"Failed to execute action '{action}' for step '{bdd_step}': {e}")

    def _determine_action(self, bdd_step: str) -> tuple:
        """Determine the action and value from the BDD step description."""
        bdd_step_lower = bdd_step.lower()
        if "click" in bdd_step_lower:
            return "click", None
        elif "enter" in bdd_step_lower:
            match = re.search(r"enter (.+)", bdd_step_lower)
            value = match.group(1) if match else "default value"
            return "input", value
        elif "verify" in bdd_step_lower or "redirected" in bdd_step_lower:
            return "verify", None
        elif "select" in bdd_step_lower:
            match = re.search(r"select (.+)", bdd_step_lower)
            value = match.group(1) if match else "default option"
            return "select", value
        elif "checkbox" in bdd_step_lower:
            if "check" in bdd_step_lower:
                return "checkbox", "check"
            elif "uncheck" in bdd_step_lower:
                return "checkbox", "uncheck"
            else:
                return "checkbox", "toggle"
        elif "choose" in bdd_step_lower:
            match = re.search(r"choose (.+)", bdd_step_lower)
            value = match.group(1) if match else "default radio option"
            return "radio", value
        return None, None

    def start_browser(self):
        """Initialize the WebDriver."""
        self.driver = webdriver.Chrome()

    def find_element(self, bdd_step: str, timeout: int = 10):
        """Find element using BDD step with self-healing capabilities."""
        if bdd_step not in self.mappings:
            self.logger.warning(f"No mapping found for BDD step: {bdd_step}.")
            return None

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
                self.logger.error(f"Attempt {attempt + 1} failed for step '{bdd_step}': {e}")
                time.sleep(1)  # Wait before retrying

        if element:
            self._record_successful_find(bdd_step, element_info)
            self.element_cache[bdd_step] = element  # Add to cache
        else:
            self._record_failed_find(bdd_step, element_info)

        return element

    def _find_with_healing(self, element_info: dict, timeout: int):
        """Find element with multiple strategies and self-healing."""
        def try_strategy(strategy, locator):
            try:
                return WebDriverWait(self.driver, timeout).until(
                    EC.presence_of_element_located((getattr(By, strategy.upper()), locator))
                )
            except Exception as e:
                self.logger.debug(f"Strategy {strategy} failed for {element_info['element_id']}: {e}")
                return None

        with ThreadPoolExecutor() as executor:
            futures = {
                executor.submit(try_strategy, strategy, locator): strategy
                for strategy, locator in element_info['locator_strategies'].items()
            }

            for future in futures:
                element = future.result()
                if element:
                    return element

        # If all strategies fail, attempt healing
        self.logger.warning(f"All locator strategies failed for element: {element_info['element_id']}, attempting healing...")
        return self._heal_element(element_info)

    def _heal_element(self, element_info: dict):
        """Attempt to heal a broken element locator."""
        try:
            original_attributes = self._get_original_attributes(element_info)
            page_elements = self._get_all_page_elements()

            best_match = self._find_best_match(original_attributes, page_elements)
            if best_match:
                self.logger.info(f"Best match found: {best_match['attributes']}")
                self._update_locator_strategies(element_info, best_match)
                return best_match['element']

            self.logger.error("No suitable match found during healing")
        except Exception as e:
            self.logger.error(f"Error during healing process: {e}")
        return None

    def _get_original_attributes(self, element_info: dict) -> dict:
        """Get original element attributes from stored information."""
        return {
            'id': element_info['element_id'],
            'tag_name': element_info.get('tag_name'),
            'class_name': element_info.get('class_name'),
            'text': element_info.get('text')
        }

    def _find_best_match(self, original_attributes: dict, page_elements: list):
        """Find the most similar element on the page using ML."""
        best_match = None
        best_score = 0
        threshold = 0.3

        original_text = self._attributes_to_text(original_attributes)
        original_embedding = self.similarity_model.encode(original_text, convert_to_tensor=True)

        for element_data in page_elements:
            current_text = self._attributes_to_text(element_data['attributes'])
            current_embedding = self.similarity_model.encode(current_text, convert_to_tensor=True)

            similarity = util.pytorch_cos_sim(original_embedding, current_embedding).item()
            self.logger.debug(f"Comparing with element {element_data['attributes']}, similarity: {similarity}")

            if similarity > best_score and similarity > threshold:
                best_score = similarity
                best_match = element_data

        return best_match

    def _attributes_to_text(self, attributes: dict) -> str:
        """Convert attributes dictionary to text for similarity comparison."""
        return ' '.join(str(value) for value in attributes.values() if value)

    def _update_locator_strategies(self, element_info: dict, new_element: dict):
        """Update stored locator strategies with new information."""
        new_id = new_element['attributes']['id']
        new_strategies = self._generate_locator_strategies(new_id)

        self.healing_history[element_info['element_id']] = {
            'timestamp': datetime.now().isoformat(),
            'original_strategies': element_info['locator_strategies'].copy(),
            'new_strategies': new_strategies,
            'matched_attributes': new_element['attributes'],
            'note': "This element was not found in the latest BDD mapping and was healed."
        }

        element_info['locator_strategies'] = new_strategies

    def _record_successful_find(self, bdd_step: str, element_info: dict):
        """Record successful element location."""
        self.logger.info(f"Successfully found element for step: {bdd_step}")

    def _record_failed_find(self, bdd_step: str, element_info: dict):
        """Record failed element location with a screenshot."""
        screenshot_path = f"screenshots/failure_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        self.driver.save_screenshot(screenshot_path)
        self.logger.error(f"Failed to find element for step: {bdd_step}. Screenshot saved to {screenshot_path}")

    def get_healing_report(self):
        """Generate report of all healing actions."""
        if not self.healing_history:
            return {"message": "No changes detected. The script ran smoothly without any issues."}
        return json.dumps(self.healing_history, indent=2)

    def save_report(self, filename="reports.json"):
        """Save healing report to a file."""
        report = self.get_healing_report()
        with open(filename, "w") as report_file:
            report_file.write(report)
            self.logger.info(f"Healing report saved to {filename}")

    def close(self):
        """Clean up resources."""
        if self.driver:
            self.driver.quit()

    def _get_all_page_elements(self) -> list:
        """Get all elements from the current page with their attributes, excluding labels and divs."""
        elements = []
        for element in self.driver.find_elements(By.XPATH, "//*"):
            try:
                # Skip elements with the tag name 'label' or 'div'
                tag_name = element.tag_name.lower()
                if tag_name == 'label' or tag_name == 'div':
                    continue

                # Generate the XPath of the element
                xpath = self._get_xpath(element)

                element_data = {
                    'element': element,
                    'attributes': {
                        'id': element.get_attribute('id'),
                        'tag_name': element.tag_name,
                        'class_name': element.get_attribute('class'),
                        'text': element.text,
                        'type': element.get_attribute('type'),
                        'name': element.get_attribute('name'),
                        'xpath': xpath  # Add XPath to the attributes
                    }
                }
                elements.append(element_data)
            except Exception as e:
                self.logger.debug(f"Failed to extract attributes for element: {e}")
                continue
        return elements

    def _get_xpath(self, element) -> str:
        """Generate the XPath of the given element."""
        xpath = ""
        current_element = element
        while current_element.tag_name.lower() != "html":
            tag_name = current_element.tag_name.lower()
            parent = current_element.find_element(By.XPATH, "..")
            siblings = parent.find_elements(By.XPATH, f"./{tag_name}")

            if len(siblings) == 1:
                xpath = f"/{tag_name}{xpath}"
            else:
                index = siblings.index(current_element) + 1
                xpath = f"/{tag_name}[{index}]{xpath}"

            current_element = parent
        return f"/html{xpath}"

# Example usage
def main():
    framework = SelfHealingFramework('./mapping.csv')
    framework.start_browser()
    try:
        framework.driver.get("http://127.0.0.1:5500/htmlexamples/htmlexamples/index.html")
        framework.execute_all_steps(delay=2.0)
        framework.save_report("reports.json")
    finally:
        framework.close()

if __name__ == "__main__":
    main()