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
import os


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
            return None


class ElementHealer:
    """Handles element healing using ML and other strategies."""
    def __init__(self, similarity_model, sym_spell):
        self.similarity_model = similarity_model
        self.sym_spell = sym_spell
        self.logger = logging.getLogger(__name__)
        self.logger.info(f"ElementHealer initialized with model: {type(similarity_model).__name__}")

    def heal_element(self, original_attributes, page_elements):
        """Attempt to heal a broken element locator."""
        self.logger.info(f"Attempting to heal element with attributes: {original_attributes}")
        best_match = self._find_best_match(original_attributes, page_elements)
        if best_match:
            self.logger.info(f"Found best match with score: {best_match.get('score', 'unknown')}")
            return best_match
        self.logger.warning("No suitable match found for healing")
        return None

    def _find_best_match(self, original_attributes, page_elements):
        """Find the most similar element on the page using ML."""
        best_match = None
        best_score = 0
        threshold = 0.3

        original_text = self._attributes_to_text(original_attributes)
        self.logger.debug(f"Original element text representation: {original_text}")
        
        try:
            original_embedding = self.similarity_model.encode(original_text, convert_to_tensor=True)
            
            for element_data in page_elements:
                current_text = self._attributes_to_text(element_data['attributes'])
                current_embedding = self.similarity_model.encode(current_text, convert_to_tensor=True)
                
                similarity = util.pytorch_cos_sim(original_embedding, current_embedding).item()
                
                if similarity > best_score and similarity > threshold:
                    best_score = similarity
                    best_match = element_data
                    # Add the score to the match data for logging
                    best_match['score'] = similarity
            
            return best_match
        except Exception as e:
            self.logger.error(f"Error during similarity calculation: {str(e)}")
            return None

    def _attributes_to_text(self, attributes):
        """Convert attributes dictionary to text for similarity comparison."""
        if not attributes:
            return ""
        
        return ' '.join(str(value) for key, value in attributes.items() if value)


class MappingLoader:
    """Handles loading and processing BDD step mappings."""
    def __init__(self, mapping):
        self.mapping = mapping

    def load_mappings(self):
        """Load BDD step to element ID mappings from CSV."""
        mappings = {}
        for row in self.mapping:
            bdd_step = row['Step'].strip()
            element_id = str(row['ID']).strip()
            css = row['CSS Selector'].strip()
            xpath = row['XPath (Absolute)'].strip()
            full_xpath = row['XPath (Absolute)'].strip()
            link = row['Page'].strip()
            mappings[bdd_step] = {
                'ID': element_id,
                'CSS Selector': css,
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
            'CSS Selector': css ,  # Generate CSS from ID if not provided
            'XPath (Absolute)': xpath ,  # Generate XPath from ID if not provided
            'XPath (Absolute)': full_xpath  # This can be None if not available
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
        elif action == "select":
            select = Select(element)
            select.select_by_visible_text(value)
        elif action == "checkbox":
            if value == "check" and not element.is_selected():
                element.click()
            elif value == "uncheck" and element.is_selected():
                element.click()
        elif action == "radio":
            if not element.is_selected():
                element.click()
        else:
            None


class SelfHealingFramework:
    def __init__(self, mapping: str):
        self.driver = None
        self.mapping_loader = MappingLoader(mapping)
        self.mappings = self.mapping_loader.load_mappings()
        self.scenario_count = 0  
        self.healing_history = {}
        
        # Set up logging
        self.logger = logging.getLogger(__name__)
        
        # Initialize model path
        model_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models', 'fine_tuned_model')
        fallback_model_path = './fine_tuned_model'  # Fallback path
        
        # Try to load the fine-tuned model with proper error handling
        try:
            if os.path.exists(model_dir):
                self.logger.info(f"Loading fine-tuned model from {model_dir}")
                self.similarity_model = SentenceTransformer(model_dir)
            elif os.path.exists(fallback_model_path):
                self.logger.info(f"Loading fine-tuned model from fallback path {fallback_model_path}")
                self.similarity_model = SentenceTransformer(fallback_model_path)
            else:
                self.logger.warning("Fine-tuned model not found, using default model")
                self.similarity_model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            self.logger.error(f"Error loading fine-tuned model: {str(e)}. Using default model.")
            self.similarity_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize other components
        self.rl_agent = RLHealingAgent(['id', 'CSS Selector', 'XPath (Absolute)', 'xpath_contains'])
        self.element_cache = {}
        self.sym_spell = SymSpell()
        self.retry_attempts = 1
        self.element_locator = ElementLocator(self.driver)
        self.element_healer = ElementHealer(self.similarity_model, self.sym_spell)
        self.action_executor = ActionExecutor(self.driver)
        self.broken_elements = {}
        self.scenario_count = len(self.mappings)  # Track total number of scenarios

    def execute_all_steps(self, delay=1.5):
        """Automatically execute all BDD steps from the CSV."""
        for bdd_step, element_info in self.mappings.items():
            current_url = self.driver.current_url
            if current_url != element_info['Page']:
                self.driver.get(element_info['Page'])
                time.sleep(delay)
            action, value = self._determine_action(bdd_step)
            try:
                element = self.find_element(bdd_step)
                time.sleep(delay)
                self.action_executor.execute_action(element, action, value)
            except Exception as e:
                None

    def _determine_action(self, bdd_step: str) -> tuple:
        """Determine the action and value from the BDD step description."""
        bdd_step_lower = bdd_step.lower()
        
        if "click" in bdd_step_lower:
            return "click", None
        elif "enter" in bdd_step_lower:
            match = re.search(r'enter(?:s|ed)?\s+(?:.*?\s+)?["\']([^"\'\\]*(?:\\.[^"\'\\]*)*)["\']', bdd_step_lower)
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

    def verify_model(self):
        """Verify that the similarity model is working correctly."""
        try:
            # Test the model with a simple example
            text1 = "id: login-button"
            text2 = "id: login-btn"
            
            embedding1 = self.similarity_model.encode(text1, convert_to_tensor=True)
            embedding2 = self.similarity_model.encode(text2, convert_to_tensor=True)
            
            similarity = util.pytorch_cos_sim(embedding1, embedding2).item()
            
            self.logger.info(f"Model verification: similarity between '{text1}' and '{text2}' is {similarity:.4f}")
            
            # Get model info
            model_info = {
                "model_type": type(self.similarity_model).__name__,
                "model_path": getattr(self.similarity_model, "model_path", "unknown"),
                "embedding_dimension": embedding1.shape[1] if hasattr(embedding1, "shape") else "unknown"
            }
            
            self.logger.info(f"Model info: {model_info}")
            
            return True, similarity, model_info
        except Exception as e:
            self.logger.error(f"Model verification failed: {str(e)}")
            return False, 0.0, {"error": str(e)}
    
    def start_browser(self):
        """Initialize the WebDriver."""
        self.driver = webdriver.Chrome()
        self.element_locator = ElementLocator(self.driver)
        self.action_executor = ActionExecutor(self.driver)
        
        # Verify the model is working
        self.verify_model()

    def find_element(self, bdd_step: str, timeout: int = 10):
        """Find element using BDD step with self-healing capabilities."""
        if bdd_step not in self.mappings:
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
                time.sleep(1)  # Wait before retrying

        if element:
            self._record_successful_find(bdd_step, element_info)
            self.element_cache[bdd_step] = element  # Add to cache
        else:
            self._record_failed_find(bdd_step, element_info)

        return element

    def _find_with_healing(self, element_info: dict, timeout: int):
        """Find element with multiple strategies and self-healing."""
        with ThreadPoolExecutor() as executor:
            futures = {
                executor.submit(self.element_locator.find_element, strategy, locator, timeout): strategy
                for strategy, locator in element_info['locator_strategies'].items()
            }

            for future in futures:
                element = future.result()
                if element:
                    return element

        # If all strategies fail, attempt healing
        return self._heal_element(element_info)

    def _heal_element(self, element_info: dict):
        """Attempt to heal a broken element locator."""
        try:
            original_attributes = self._get_original_attributes(element_info)
            page_elements = self._get_all_page_elements()

            best_match = self.element_healer.heal_element(original_attributes, page_elements)
            if best_match:
                self._update_locator_strategies(element_info, best_match)
                return best_match['element']

        except Exception as e:
            None
        return None

    def _get_original_attributes(self, element_info: dict) -> dict:
        """Get original element attributes from stored information."""
        return {
            'id': element_info['ID'],
            'tag_name': element_info.get('tag_name'),
            'class_name': element_info.get('class_name'),
            'text': element_info.get('text')
        }

    def _update_locator_strategies(self, element_info: dict, new_element: dict):
        """Update stored locator strategies with new information."""
        new_id = new_element['attributes']['id']
        new_xpath = new_element['attributes'].get('XPath (Absolute)')
        
        # Generate CSS selector based on available attributes
        css_selector = f"#{new_id}" if new_id else None
        
        new_strategies = self.mapping_loader._generate_locator_strategies(
            element_id=new_id,
            css=css_selector,
            xpath=new_xpath,
            full_xpath=new_xpath
        )

        self.healing_history[element_info['ID']] = {
            'timestamp': datetime.now().isoformat(),
            'original_strategies': element_info['locator_strategies'].copy(),
            'new_strategies': new_strategies,
            'matched_attributes': new_element['attributes'],
            'note': "This element was not found in the latest BDD mapping and was healed."
        }

        element_info['locator_strategies'] = new_strategies

    def _record_successful_find(self, bdd_step: str, element_info: dict):
        """Record successful element location."""

    def _record_failed_find(self, bdd_step: str, element_info: dict):
        """Record failed element location with a screenshot."""
        screenshot_path = f"screenshots/failure_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        self.driver.save_screenshot(screenshot_path)
        self.broken_elements[element_info['ID']] = {
            'timestamp': datetime.now().isoformat(),
            'bdd_step': bdd_step,
            'original_strategies': element_info['locator_strategies'].copy(),
            'screenshot_path': screenshot_path,
            'note': "This element was not found in the latest BDD mapping and is broken."
        }
        self.broken_elements[element_info['ID']] = {
            'timestamp': datetime.now().isoformat(),
            'bdd_step': bdd_step,
            'original_strategies': element_info['locator_strategies'].copy(),
            'screenshot_path': screenshot_path,
            'note': "This element was not found in the latest BDD mapping and is broken."
        }

    def get_healing_report(self):
        """Generate standardized report compatible with frontend expectations."""
        # Initialize report with default structure
        report = {
            "success": True,
            "message": "",
            "healed_elements": [],
            "broken_elements": [],
            "metrics": {
                "total_scenarios": 0,
                "healed_count": 0,
                "broken_count": 0
            }
        }

        # Case 1: No healing or broken elements
        if not self.healing_history and not self.broken_elements:
            report["message"] = "No changes detected. The script ran smoothly without any issues."
            return report  # Return as dict (frontend will handle JSON parsing)

        # Process healed elements
        for element_id, details in self.healing_history.items():
            report["healed_elements"].append({
                "original_element_id": element_id,
                "timestamp": details.get("timestamp", ""),
                "original_strategies": details.get("original_strategies", {}),
                "new_strategies": details.get("new_strategies", {}),
                "matched_attributes": details.get("matched_attributes", []),
                "note": details.get("note", "")
            })

        # Process broken elements
        for element_id, details in self.broken_elements.items():
            report["broken_elements"].append({
                "element_id": element_id,
                "timestamp": details.get("timestamp", ""),
                "bdd_step": details.get("bdd_step", ""),
                "original_strategies": details.get("original_strategies", {}),
                "screenshot_path": details.get("screenshot_path", ""),
                "note": details.get("note", "")
            })

        # Update metrics
        report["metrics"] = {
            "total_scenarios": self.scenario_count,
            "healed_count": len(report["healed_elements"]),
            "broken_count": len(report["broken_elements"])
        }

        # Determine overall success status
        report["success"] = len(report["broken_elements"]) == 0

        return report  # Return as dictionary

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

    def report(self):
        """Save healing report to a file."""
        return self.get_healing_report()

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
                        'XPath (Absolute)': xpath  # Add XPath to the attributes
                    }
                }
                elements.append(element_data)
            except Exception as e:
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
