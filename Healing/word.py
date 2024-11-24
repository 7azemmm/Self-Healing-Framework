from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from fuzzywuzzy import fuzz
import nltk
import numpy as np
from typing import Dict, List
import logging
from datetime import datetime
import json
import re
import time

# Download required NLTK data
nltk.download('punkt', quiet=True)
nltk.download('averaged_perceptron_tagger', quiet=True)
nltk.download('wordnet', quiet=True)
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# Set up logging configuration
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class SelfHealingFramework:
    def __init__(self, mapping_file_path: str):
        self.driver = None
        self.logger = logger
        self.mappings = self._load_mappings(mapping_file_path)
        self.healing_history = {}
        self.vectorizer = TfidfVectorizer(lowercase=True)
        self.lemmatizer = WordNetLemmatizer()
        # Weights for different similarity components
        self.weights = {
            'semantic': 0.3,
            'structural': 0.4,
            'attribute': 0.3
        }

    def _load_mappings(self, file_path: str) -> dict:
        """Load BDD step to element ID mappings from CSV"""
        df = pd.read_csv(file_path)
        mappings = {}
        for _, row in df.iterrows():
            bdd_step = row['BDD Step'].strip()
            element_id = row['Element ID'].strip()
            mappings[bdd_step] = {
                'element_id': element_id,
                'locator_strategies': self._generate_locator_strategies(element_id)
            }
        return mappings
    
    def _generate_locator_strategies(self, element_id: str) -> dict:
        """Generate multiple locator strategies for an element"""
        return {
            'id': element_id,
            'css': f'#{element_id}',
            'xpath': f'//*[@id="{element_id}"]',
            'xpath_contains': f'//*[contains(@id, "{element_id}")]'
        }

    def execute_all_steps(self, delay=1.5):
        """Automatically execute all BDD steps from the CSV"""
        for bdd_step, element_info in self.mappings.items():
            action, value = self._determine_action(bdd_step)
            self.logger.info(f"Executing step: {bdd_step} - Action: {action}, Value: {value}")
            try:
                element = self.find_element(bdd_step)
                time.sleep(delay)
                self._execute_action(element, action, value, bdd_step)
            except Exception as e:
                self.logger.error(f"Failed to execute action '{action}' for step '{bdd_step}': {e}")

    def _execute_action(self, element, action, value, bdd_step):
        """Execute the specified action on the element"""
        if not element:
            self.logger.error(f"No element found for step: {bdd_step}")
            return

        try:
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
            elif action == "checkbox":
                if value == "check" and not element.is_selected():
                    element.click()
                elif value == "uncheck" and element.is_selected():
                    element.click()
            elif action == "radio":
                if not element.is_selected():
                    element.click()
            else:
                self.logger.warning(f"Unrecognized action '{action}' for step '{bdd_step}'")
        except Exception as e:
            self.logger.error(f"Action execution failed for '{bdd_step}': {e}")

    def _determine_action(self, bdd_step: str) -> tuple:
        """Determine the action and value from the BDD step description"""
        bdd_step_lower = bdd_step.lower()
        
        action_patterns = {
            r"click": ("click", None),
            r"enter\s+(.+)": ("input", lambda m: m.group(1)),
            r"verify|redirected": ("verify", None),
            r"select\s+(.+)": ("select", lambda m: m.group(1)),
            r"(un)?check": ("checkbox", lambda m: "uncheck" if m.group(1) else "check"),
            r"choose\s+(.+)": ("radio", lambda m: m.group(1))
        }
        
        for pattern, (action, value_extractor) in action_patterns.items():
            match = re.search(pattern, bdd_step_lower)
            if match:
                value = value_extractor(match) if callable(value_extractor) else value_extractor
                if action == "input" and "email" in bdd_step_lower:
                    value = value if "@" in value else "default@example.com"
                return action, value
        
        return None, None

    def start_browser(self):
        """Initialize the WebDriver"""
        self.driver = webdriver.Chrome()
        
    def find_element(self, bdd_step: str, timeout: int = 10):
        """Find element using BDD step with self-healing capabilities"""
        if bdd_step not in self.mappings:
            self.logger.warning(f"No mapping found for BDD step: {bdd_step}")
            return None
            
        element_info = self.mappings[bdd_step]
        element = self._find_with_healing(element_info, timeout)
        
        if element:
            self._record_successful_find(bdd_step, element_info)
        else:
            self._record_failed_find(bdd_step, element_info)
            
        return element
    
    def _find_with_healing(self, element_info: dict, timeout: int):
        """Find element with multiple strategies and self-healing"""
        for strategy, locator in element_info['locator_strategies'].items():
            try:
                element = WebDriverWait(self.driver, timeout).until(
                    EC.presence_of_element_located((getattr(By, strategy.upper()), locator))
                )
                return element
            except Exception as e:
                self.logger.debug(f"Strategy {strategy} failed: {e}")
                continue
                
        self.logger.warning("All locator strategies failed, attempting healing...")
        return self._heal_element(element_info)
    
    def _heal_element(self, element_info: dict):
        """Attempt to heal a broken element locator"""
        original_attributes = self._get_original_attributes(element_info)
        page_elements = self._get_all_page_elements()
        
        self.logger.debug(f"Original attributes for healing: {original_attributes}")
        self.logger.debug(f"Found page elements: {[elem['attributes'] for elem in page_elements]}")
        
        best_match = self._find_best_match(original_attributes, page_elements)
        if best_match:
            self.logger.info(f"Best match found: {best_match['attributes']}")
            self._update_locator_strategies(element_info, best_match)
            return best_match['element']
        
        self.logger.error("No suitable match found during healing")
        return None
    
    def _get_original_attributes(self, element_info: dict) -> dict:
        """Get original element attributes"""
        return {
            'id': element_info['element_id'],
            'tag_name': element_info.get('tag_name'),
            'class_name': element_info.get('class_name'),
            'text': element_info.get('text')
        }
    
    def _get_all_page_elements(self) -> list:
        """Get all elements from current page with attributes"""
        elements = []
        for element in self.driver.find_elements(By.XPATH, "//*"):
            try:
                elements.append({
                    'element': element,
                    'attributes': {
                        'id': element.get_attribute('id'),
                        'tag_name': element.tag_name,
                        'class_name': element.get_attribute('class'),
                        'text': element.text,
                        'type': element.get_attribute('type'),
                        'name': element.get_attribute('name')
                    }
                })
            except Exception as e:
                self.logger.debug(f"Failed to extract attributes: {e}")
                continue
        return elements

    def _find_best_match(self, original_attributes: dict, page_elements: list):
        """Find the most similar element using enhanced matching"""
        if not page_elements:
            return None

        best_match = None
        best_score = 0
        threshold = 0.6

        original_text = self._attributes_to_text(original_attributes)
        original_struct = self._get_structural_features(original_attributes)

        # Preprocess all texts for TF-IDF
        texts = [original_text]
        elements_texts = []
        for element_data in page_elements:
            current_text = self._attributes_to_text(element_data['attributes'])
            texts.append(current_text)
            elements_texts.append(current_text)

        # Calculate TF-IDF vectors
        tfidf_matrix = self.vectorizer.fit_transform(texts)
        original_vector = tfidf_matrix[0]
        element_vectors = tfidf_matrix[1:]

        for idx, element_data in enumerate(page_elements):
            try:
                current_struct = self._get_structural_features(element_data['attributes'])

                # Calculate semantic similarity using TF-IDF
                semantic_score = float(cosine_similarity(original_vector, element_vectors[idx])[0])

                # Calculate structural similarity
                structural_score = self._calculate_structural_similarity(
                    original_struct, current_struct)

                # Calculate attribute similarity
                attribute_score = self._calculate_attribute_similarity(
                    original_attributes, element_data['attributes']
                )

                # Calculate combined score
                combined_score = (
                    self.weights['semantic'] * semantic_score +
                    self.weights['structural'] * structural_score +
                    self.weights['attribute'] * attribute_score
                )

                self.logger.debug(
                    f"Element comparison scores - Semantic: {semantic_score:.3f}, "
                    f"Structural: {structural_score:.3f}, "
                    f"Attribute: {attribute_score:.3f}, "
                    f"Combined: {combined_score:.3f}"
                )

                if combined_score > best_score and combined_score > threshold:
                    best_score = combined_score
                    best_match = element_data

            except Exception as e:
                self.logger.debug(f"Failed to calculate similarity: {e}")
                continue

        return best_match

    def _attributes_to_text(self, attributes: dict) -> str:
        """Convert attributes dictionary to text with NLTK preprocessing"""
        # Combine all attribute values
        text = ' '.join(str(value) for value in attributes.values() if value)
        
        # Tokenize and lemmatize
        tokens = word_tokenize(text.lower())
        lemmatized = [self.lemmatizer.lemmatize(token) for token in tokens]
        
        return ' '.join(lemmatized)

    def _calculate_structural_similarity(self, struct1: Dict, struct2: Dict) -> float:
        """Calculate structural similarity between elements"""
        # More detailed structural comparison
        comparisons = {
            'tag_type': float(struct1['tag_type'] == struct2['tag_type']) * 2.0,  # Double weight for tag type
            'input_type': float(struct1['input_type'] == struct2['input_type']) \
                if struct1['tag_type'] == 'input' else 1.0,
            'has_id': float(struct1['has_id'] == struct2['has_id']),
            'has_class': float(struct1['has_class'] == struct2['has_class']),
            'has_name': float(struct1['has_name'] == struct2['has_name']),
            'has_text': float(struct1['has_text'] == struct2['has_text'])
        }
        
        weights = {
            'tag_type': 0.4,
            'input_type': 0.3,
            'has_id': 0.1,
            'has_class': 0.1,
            'has_name': 0.05,
            'has_text': 0.05
        }
        
        weighted_sum = sum(score * weights[attr] for attr, score in comparisons.items())
        return weighted_sum

    def _calculate_attribute_similarity(self, attrs1: Dict, attrs2: Dict) -> float:
        """Calculate similarity between element attributes using enhanced fuzzy matching"""
        scores = []
        weights = {
            'id': 0.4,
            'text': 0.3,
            'class_name': 0.2,
            'name': 0.1
        }
        
        for attr, weight in weights.items():
            if attrs1.get(attr) and attrs2.get(attr):
                # Use token sort ratio for better partial matching
                score = fuzz.token_sort_ratio(str(attrs1[attr]), str(attrs2[attr])) / 100.0
                scores.append(score * weight)
        
        return sum(scores) / sum(weights[attr] for attr in weights if attrs1.get(attr) and attrs2.get(attr)) \
            if scores else 0.0

    def _get_structural_features(self, attributes: dict) -> Dict:
        """Extract structural features from element attributes"""
        return {
            'tag_type': attributes.get('tag_name', '').lower(),
            'input_type': attributes.get('type', '').lower(),
            'has_id': bool(attributes.get('id')),
            'has_class': bool(attributes.get('class_name')),
            'has_name': bool(attributes.get('name')),
            'has_text': bool(attributes.get('text'))
        }

    def _update_locator_strategies(self, element_info: dict, new_element: dict):
        """Update locator strategies with new information"""
        new_id = new_element['attributes']['id']
        new_strategies = self._generate_locator_strategies(new_id)
        
        self.healing_history[element_info['element_id']] = {
            'timestamp': datetime.now().isoformat(),
            'original_strategies': element_info['locator_strategies'].copy(),
            'new_strategies': new_strategies,
            'matched_attributes': new_element['attributes'],
            'note': "Element was healed using enhanced matching algorithm."
        }
        
        element_info['locator_strategies'] = new_strategies
    
    def _record_successful_find(self, bdd_step: str, element_info: dict):
        """Record successful element location"""
        """Record successful element location"""
        self.logger.info(f"Successfully found element for step: {bdd_step}")
        
    def _record_failed_find(self, bdd_step: str, element_info: dict):
        """Record failed element location"""
        self.logger.error(f"Failed to find element for step: {bdd_step}")
        
    def get_healing_report(self):
        """Generate report of all healing actions"""
        if not self.healing_history:
            return json.dumps({
                "message": "No healing actions performed. The script ran smoothly."
            }, indent=2)
        
        report = {
            "summary": {
                "total_healings": len(self.healing_history),
                "timestamp": datetime.now().isoformat()
            },
            "healings": self.healing_history
        }
        return json.dumps(report, indent=2)
    
    def save_report(self, filename="healing_report.json"):
        """Save healing report to a file"""
        report = self.get_healing_report()
        with open(filename, "w") as report_file:
            report_file.write(report)
            self.logger.info(f"Healing report saved to {filename}")
    
    def clear_cache(self):
     """Clear all caches to free memory"""
     if hasattr(self, 'embedding_cache'):
        self.embedding_cache.clear()
    
def close(self):
    """Clean up resources"""
    try:
        self.clear_cache()
    except AttributeError:
        pass  # Ignore if cache doesn't exist
        
    if self.driver:
        self.driver.quit()

def main():
    """Main execution function"""
    framework = SelfHealingFramework('./bdd_element_mapping.csv')
    framework.start_browser()
    
    try:
        # Navigate to application
        framework.driver.get("http://127.0.0.1:5500/index.html")
        
        # Execute test steps
        framework.execute_all_steps(delay=2.0)
        
        # Save report
        framework.save_report("reports.json")
        
    finally:
        framework.close()

if __name__ == "__main__":
    main()





