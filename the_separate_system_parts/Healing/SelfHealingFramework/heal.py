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
import os

# Set up logging configuration
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class RLHealingAgent:
    """Reinforcement learning agent for strategy selection."""
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


class ElementLocator:
    """Handles element location strategies."""
    def __init__(self, driver):
        self.driver = driver

    def find_element(self, strategy, locator, timeout=10):
        """Find element using a specific strategy."""
        try:
            return WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((getattr(By, strategy.upper()), locator))
            )
        except Exception as e:
            logger.debug(f"Strategy {strategy} failed for {locator}: {e}")
            return None


class ElementHealer:
    """Handles element healing using ML and other strategies."""
    def __init__(self, similarity_model, sym_spell):
        self.similarity_model = similarity_model
        self.sym_spell = sym_spell

    def heal_element(self, original_attributes, page_elements):
        """Attempt to heal a broken element locator."""
        logger.info(f"Starting healing process with {len(page_elements)} elements")
        logger.info(f"Original attributes: {original_attributes}")
        
        if not page_elements:
            logger.error("No page elements found for comparison")
            return None
            
        best_match = self._find_best_match(original_attributes, page_elements)
        if best_match:
            logger.info(f"Best match found: {best_match['attributes']}")
            return best_match
        logger.error("No suitable match found during healing")
        return None

    def _find_best_match(self, original_attributes, page_elements):
        """Find the most similar element on the page using ML."""
        best_match = None
        best_score = 0
        threshold = 0.4  # Lower threshold to find more matches
        
        # Filter out None values and ensure we have at least some text to compare
        filtered_attrs = {k: v for k, v in original_attributes.items() if v}
        if not filtered_attrs:
            logger.warning("No valid attributes found for matching")
            # Add fallback attributes if needed
            filtered_attrs = {'tag_name': 'input'}
            
        original_text = self._attributes_to_text(filtered_attrs)
        logger.debug(f"Original text for matching: '{original_text}'")
        
        try:
            original_embedding = self.similarity_model.encode(original_text, convert_to_tensor=True)
        except Exception as e:
            logger.error(f"Error encoding original text: {e}")
            return None
            
        matches = []
        for element_data in page_elements:
            try:
                current_text = self._attributes_to_text(element_data['attributes'])
                if not current_text.strip():
                    continue
                    
                current_embedding = self.similarity_model.encode(current_text, convert_to_tensor=True)
                similarity = util.pytorch_cos_sim(original_embedding, current_embedding).item()
                
                logger.debug(f"Element: {current_text}, Similarity: {similarity}")
                matches.append((similarity, element_data))
                
                if similarity > best_score and similarity > threshold:
                    best_score = similarity
                    best_match = element_data
            except Exception as e:
                logger.debug(f"Error comparing element: {e}")
                
        # Log top matches for debugging
        matches.sort(reverse=True)
        for i, (score, element) in enumerate(matches[:3]):
            logger.info(f"Top match #{i+1}: Score {score}, Element: {element['attributes']}")
                
        return best_match

    def _attributes_to_text(self, attributes):
        """Convert attributes dictionary to text for similarity comparison."""
        return ' '.join(str(value) for key, value in attributes.items() if value)


class MappingLoader:
    """Handles loading and processing BDD step mappings."""
    def __init__(self, file_path):
        self.file_path = file_path

    def load_mappings(self):
        """Load BDD step to element ID mappings from CSV."""
        df = pd.read_csv(self.file_path)
        mappings = {}
        for _, row in df.iterrows():
            bdd_step = row['Step'].strip()
            element_id = str(row['ID']).strip()
            css = str(row['CSS Selector']).strip()
            xpath = row['XPath (Absolute)'].strip()
            Name = str(row['Name']).strip()
            full_xpath = row['XPath (Absolute)'].strip()
            link = row['Page'].strip()
            mappings[bdd_step] = {
                'ID': element_id,
                'CSS Selector': css,
                'Name' : Name ,
                'XPath (Absolute)': xpath,
                'XPath (Absolute)': full_xpath,
                'Page': link,
                'locator_strategies': self._generate_locator_strategies(element_id, css, xpath, full_xpath)
            }
        return mappings

    def _generate_locator_strategies(self, element_id, css, xpath, full_xpath):
        """Generate multiple locator strategies for an element."""
        return {
            'id': element_id,
            'css': css ,
            'xpath': xpath ,
            'full_xpath': full_xpath 
        }


class ActionExecutor:
    """Handles execution of actions based on BDD steps."""
    def __init__(self, driver):
        self.driver = driver

    def execute_action(self, element, action, value=None):
        """Execute an action on the given element."""
        if action == "click":
            element.click()
        elif action == "input":
            element.clear()
            element.send_keys(value)
        elif action == "verify":
            is_visible = element.is_displayed()
            logger.info(f"Verification result: {is_visible}")
        elif action == "select":
            select = Select(element)
            select.select_by_visible_text(value)
            logger.info(f"Selected '{value}' in dropdown")
        elif action == "checkbox":
            if value == "check" and not element.is_selected():
                element.click()
            elif value == "uncheck" and element.is_selected():
                element.click()
        elif action == "radio":
            if not element.is_selected():
                element.click()
                logger.info("Selected radio button")
        else:
            logger.warning(f"Unrecognized action: {action}")


class SelfHealingFramework:
    def __init__(self, mapping_file_path: str):
        self.driver = None
        self.logger = logger
        self.mapping_loader = MappingLoader(mapping_file_path)
        self.mappings = self.mapping_loader.load_mappings()
        self.healing_history = {}
        self.broken_elements = {}  # New: Track broken elements that couldn't be healed
        
        # Fix model loading with error handling
        try:
            self.similarity_model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')  # Use a default model that exists
        except Exception as e:
            self.logger.error(f"Error loading model: {e}")
            # Fallback to a simple model or raise exception
            raise Exception(f"Could not load similarity model: {e}")
        
        self.rl_agent = RLHealingAgent(['id', 'css', 'xpath', 'xpath_contains'])
        self.element_cache = {}
        
        
        self.sym_spell = SymSpell()
        try:
            self.sym_spell.load_dictionary('dictionary.txt', term_index=0, count_index=1)
        except Exception as e:
            self.logger.warning(f"Could not load dictionary: {e}. Proceeding without spell correction.")
        
        self.retry_attempts = 2
        self.element_locator = ElementLocator(self.driver)
        self.element_healer = ElementHealer(self.similarity_model, self.sym_spell)
        self.action_executor = ActionExecutor(self.driver)

    def execute_all_steps(self, delay=1.5):
        """Automatically execute all BDD steps from the CSV."""
        for bdd_step, element_info in self.mappings.items():
            current_url = self.driver.current_url
            if current_url != element_info['Page']:
                self.driver.get(element_info['Page'])
                time.sleep(delay)
            action, value = self._determine_action(bdd_step)
            self.logger.info(f"Executing step: {bdd_step} - Action: {action}, Value: {value}")
            try:
                element = self.find_element(bdd_step)
                time.sleep(delay)
                self.action_executor.execute_action(element, action, value)
            except Exception as e:
                self.logger.error(f"Failed to execute action '{action}' for step '{bdd_step}': {e}")

    def _determine_action(self, bdd_step: str) -> tuple:
        """Determine the action and value from the BDD step description."""
        bdd_step_lower = bdd_step.lower()
        if "click" in bdd_step_lower:
            return "click", None
        elif "enter" in bdd_step_lower:
            match = re.search(r'enter\s+.*?"{1,3}([^"]+)"{1,3}', bdd_step_lower.lower())
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
        self.element_locator = ElementLocator(self.driver)

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
        self.logger.debug(f"Finding element with strategies: {element_info['locator_strategies']}")
        
        with ThreadPoolExecutor() as executor:
            futures = {
                executor.submit(self.element_locator.find_element, strategy, locator, timeout): (strategy, locator)
                for strategy, locator in element_info['locator_strategies'].items() if locator
            }

            for future in futures:
                strategy, locator = futures[future]
                element = future.result()
                if element:
                    self.logger.debug(f"Found element using strategy {strategy}: {locator}")
                    return element

        # If all strategies fail, attempt healing
        self.logger.warning(f"All locator strategies failed for element: {element_info['ID']}, attempting healing...")
        return self._heal_element(element_info)

    def _heal_element(self, element_info: dict):
        """Attempt to heal a broken element locator."""
        try:
            self.logger.info(f"Attempting to heal element: {element_info['ID']}")
            original_attributes = self._get_original_attributes(element_info)
            self.logger.debug(f"Original attributes: {original_attributes}")
            
            page_elements = self._get_all_page_elements()
            self.logger.debug(f"Found {len(page_elements)} candidate elements on page")
            
            best_match = self.element_healer.heal_element(original_attributes, page_elements)
            if best_match:
                self.logger.info(f"Healing successful for element {element_info['ID']}")
                self._update_locator_strategies(element_info, best_match)
                return best_match['element']
            
            self.logger.error(f"No suitable match found during healing for {element_info['ID']}")
        except Exception as e:
            self.logger.error(f"Error during healing process: {e}")
            import traceback
            self.logger.error(traceback.format_exc())
        return None

    def _get_original_attributes(self, element_info: dict) -> dict:
        """Get original element attributes from stored information."""
        return {
            'id': element_info['ID'],
            'tag_name': element_info.get('tag_name', ''),
            'class_name': element_info.get('CSS Selector', ''),  # Use CSS Selector as class_name
            'text': '',  # Add default empty text
            'xpath': element_info.get('XPath (Absolute)', '')  # Add XPath information
        }

    def _update_locator_strategies(self, element_info: dict, new_element: dict):
        """Update stored locator strategies with new information."""
        new_id = new_element['attributes'].get('id', '')
        new_xpath = new_element['attributes'].get('xpath', '')
        
        # Generate CSS selector based on available attributes
        css_selector = f"#{new_id}" if new_id else None
        
        new_strategies = self.mapping_loader._generate_locator_strategies(
            element_id=new_id,
            css=css_selector,
            xpath=new_xpath,
            full_xpath=new_xpath
        )

        self.healing_history[element_info['ID']] = {  # Use 'ID' instead of 'element_id'
            'timestamp': datetime.now().isoformat(),
            'original_strategies': element_info['locator_strategies'].copy(),
            'new_strategies': new_strategies,
            'matched_attributes': new_element['attributes'],
            'note': "This element was healed with new locator strategies."
        }

        # Update the element info with new strategies
        element_info['locator_strategies'] = new_strategies

    def _record_successful_find(self, bdd_step: str, element_info: dict):
        """Record successful element location."""
        self.logger.info(f"Successfully found element for step: {bdd_step}")

    def _record_failed_find(self, bdd_step: str, element_info: dict):
        """Record failed element location with a screenshot."""
        timestamp = datetime.now().isoformat()
        screenshot_path = f"screenshots/failure_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        self.driver.save_screenshot(screenshot_path)
        
        # Add to broken elements history
        self.broken_elements[element_info['ID']] = {
            'timestamp': timestamp,
            'bdd_step': bdd_step,
            'original_strategies': element_info['locator_strategies'],
            'screenshot_path': screenshot_path,
            'note': "Element could not be found or healed"
        }
        
        self.logger.error(f"Failed to find element for step '{bdd_step}'. Screenshot saved to {screenshot_path}")

    def get_healing_report(self):
        """Generate report of all healing actions and broken elements."""
        if not self.healing_history and not self.broken_elements:
            return json.dumps({
                "message": "No changes detected. The script ran smoothly without any issues."
            }, indent=2)
        
        report = {
            "healed_elements": [],
            "broken_elements": []
        }
        
        # Add healed elements
        for element_id, details in self.healing_history.items():
            report["healed_elements"].append({
                "original_element_id": element_id,
                "timestamp": details["timestamp"],
                "original_strategies": details["original_strategies"],
                "new_strategies": details["new_strategies"],
                "matched_attributes": details["matched_attributes"],
                "note": details["note"]
            })
        
        # Add broken elements
        for element_id, details in self.broken_elements.items():
            report["broken_elements"].append({
                "element_id": element_id,
                "timestamp": details["timestamp"],
                "bdd_step": details["bdd_step"],
                "original_strategies": details["original_strategies"],
                "screenshot_path": details["screenshot_path"],
                "note": details["note"]
            })
        
        return json.dumps(report, indent=2)

    def save_report(self, filename="reports.json"):
        """Save healing report to a file."""
        # Create screenshots directory if it doesn't exist
        screenshots_dir = "screenshots"
        if not os.path.exists(screenshots_dir):
            os.makedirs(screenshots_dir)
        
        # Create reports directory if it doesn't exist
        reports_dir = os.path.dirname(filename)
        if reports_dir and not os.path.exists(reports_dir):
            os.makedirs(reports_dir)
        
        # Create a more comprehensive report
        report = self.get_healing_report()
        self.logger.info(f"Healing history: {len(self.healing_history)} healed elements")
        self.logger.info(f"Broken elements: {len(self.broken_elements)} elements")
        
        with open(filename, "w", encoding="utf-8") as report_file:
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
        # framework.driver.get("http://127.0.0.1:5500/login.html")
        framework.execute_all_steps(delay=2.0)
        framework.save_report("reports.json")
    finally:
        framework.close()


if __name__ == "__main__":
    main()