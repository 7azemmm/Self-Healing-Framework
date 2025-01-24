from bs4 import BeautifulSoup
import os
from shared import tokenizer, model
import torch
from transformers import pipeline
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

def process_html(directory_path):
    """
    Process HTML files in a directory, extract elements, and generate embeddings and semantic descriptions.
    Includes all possible identifiers for each element (e.g., id, class, name, XPath, CSS selector, etc.).
    """
    html_pages = {}
    try:
        summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    except Exception as e:
        print(f"Failed to load summarization model: {e}")
        summarizer = None  # Fallback to no summarization

    # List of interactive HTML elements to include
    interactive_elements = [
        "input",  # Includes text, password, checkbox, radio, etc.
        "select",  # Dropdowns
        "button",  # Buttons
        "textarea",  # Multi-line text input
        "a",  # Links (if they are interactive)
        "label",  # Labels (if they are associated with inputs)
        "option",  # Options within a select element
        "datalist",  # Data list for input suggestions
        "fieldset",  # Grouping related elements
        "legend",  # Caption for fieldset
        "output",  # Output of a calculation
        "progress",  # Progress bar
        "meter",  # Scalar measurement
    ]

    for file_name in os.listdir(directory_path):
        if file_name.endswith(".html"):
            with open(os.path.join(directory_path, file_name), "r", encoding="utf-8") as file:
                soup = BeautifulSoup(file, "html.parser")
            
            # Extract interactive elements of interest
            elements = []
            for tag in soup.find_all(interactive_elements):  # Focus on interactive elements
                # Extract basic attributes
                attributes = {
                    "role": tag.name,
                    "id": tag.get("id"),
                    "name": tag.get("name"),
                    "type": tag.get("type"),
                    "value": tag.get("value"),  # Add value attribute
                    "class": tag.get("class"),
                    "text": tag.text.strip(),
                    "placeholder": tag.get("placeholder", ""),  # Include placeholder
                    "parent": tag.parent.name if tag.parent else None,
                    "siblings": [sibling.name for sibling in tag.find_previous_siblings()]
                }

                # Generate XPath and CSS selector for the element
                xpath_absolute = get_xpath(tag, absolute=True)
                xpath_relative = get_xpath(tag, absolute=False)
                css_selector = get_css_selector(tag)

                # Add XPath and CSS selector to attributes
                attributes["xpath_absolute"] = xpath_absolute
                attributes["xpath_relative"] = xpath_relative
                attributes["css_selector"] = css_selector

                # Create a text representation of the element
                element_text = (
                    f"{attributes['role']} "
                    f"id={attributes['id']} "
                    f"name={attributes['name']} "
                    f"type={attributes['type']} "
                    f"value={attributes['value']} "  # Include value in the text representation
                    f"text={attributes['text']} "
                    f"placeholder={attributes['placeholder']} "
                    f"parent={attributes['parent']} "
                    f"siblings={attributes['siblings']} "
                    f"xpath_absolute={attributes['xpath_absolute']} "
                    f"xpath_relative={attributes['xpath_relative']} "
                    f"css_selector={attributes['css_selector']} "
                )
                
                # Generate embedding for the element
                embedding = get_embedding(element_text)
                description = generate_semantic_description(element_text, summarizer)  # Generate semantic description
                elements.append({
                    "content": str(tag),
                    "attributes": attributes,
                    "embedding": embedding,
                    "description": description
                })
            
            # Generate embedding for the entire HTML page
            page_text = soup.get_text()
            page_embedding = get_embedding(page_text)
            page_description = generate_semantic_description(page_text, summarizer)  # Generate semantic description
            html_pages[file_name] = {
                "elements": elements,
                "embedding": page_embedding,
                "description": page_description
            }
    
    return html_pages

def get_embedding(text):
    """
    Generate embeddings for a given text using the E5 model.
    """
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        outputs = model(**inputs)
    return outputs.last_hidden_state.mean(dim=1)  # Average pooling

def generate_semantic_description(text, summarizer):
    """
    Generate a semantic description of a text using a summarization model.
    """
    if summarizer:
        input_length = len(text.split())
        max_length = min(50, input_length)
        min_length = min(25, max_length // 2)
        description = summarizer(text, max_length=max_length, min_length=min_length, do_sample=False)[0]['summary_text']
        return description
    else:
        return "No description available"

def get_xpath(tag, absolute=True):
    """
    Generate XPath for a given tag.
    If absolute=True, returns the absolute XPath.
    If absolute=False, returns the relative XPath.
    """
    path = []
    current = tag
    while current:
        if current.name:
            # Get the tag name
            tag_name = current.name
            # Get the index of the current tag among its siblings
            siblings = [sibling for sibling in current.parent.find_all(tag_name, recursive=False)] if current.parent else []
            index = siblings.index(current) + 1 if siblings else 1
            # Append the tag name and index to the path
            path.append(f"{tag_name}[{index}]")
        current = current.parent
    # Reverse the path to get the correct order
    path.reverse()
    # Join the path with '/' for absolute XPath or './' for relative XPath
    xpath = "/" + "/".join(path) if absolute else "./" + "/".join(path)
    return xpath

def get_css_selector(tag):
    """
    Generate a CSS selector for a given tag.
    """
    selector = tag.name
    if tag.get("id"):
        selector += f"#{tag.get('id')}"
    elif tag.get("class"):
        selector += "." + ".".join(tag.get("class"))
    return selector

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
            # Get the current page's HTML source
            page_source = self.driver.page_source
            # Process the HTML to extract elements and their embeddings
            soup = BeautifulSoup(page_source, "html.parser")
            page_elements = self._process_html_from_soup(soup)

            original_attributes = self._get_original_attributes(element_info)

            best_match = self._find_best_match(original_attributes, page_elements)
            if best_match:
                self.logger.info(f"Best match found: {best_match['attributes']}")
                self._update_locator_strategies(element_info, best_match)
                return best_match['element']

            self.logger.error("No suitable match found during healing")
        except Exception as e:
            self.logger.error(f"Error during healing process: {e}")
        return None

    def _process_html_from_soup(self, soup):
        """Process HTML from BeautifulSoup object to extract elements."""
        elements = []
        interactive_elements = [
            "input", "select", "button", "textarea", "a", "label", "option",
            "datalist", "fieldset", "legend", "output", "progress", "meter"
        ]
        for tag in soup.find_all(interactive_elements):
            attributes = {
                "role": tag.name,
                "id": tag.get("id"),
                "name": tag.get("name"),
                "type": tag.get("type"),
                "value": tag.get("value"),
                "class": tag.get("class"),
                "text": tag.text.strip(),
                "placeholder": tag.get("placeholder", ""),
                "parent": tag.parent.name if tag.parent else None,
                "siblings": [sibling.name for sibling in tag.find_previous_siblings()]
            }
            element_text = (
                f"{attributes['role']} "
                f"id={attributes['id']} "
                f"name={attributes['name']} "
                f"type={attributes['type']} "
                f"value={attributes['value']} "
                f"text={attributes['text']} "
                f"placeholder={attributes['placeholder']} "
                f"parent={attributes['parent']} "
                f"siblings={attributes['siblings']} "
            )
            embedding = get_embedding(element_text)
            elements.append({
                "element": tag,
                "attributes": attributes,
                "embedding": embedding
            })
        return elements

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
    # Process HTML files
    # html_pages = process_html('./htmlexamples')
    # print(json.dumps(html_pages, indent=2))

    # Execute self-healing framework
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
    