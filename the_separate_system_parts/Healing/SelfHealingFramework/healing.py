from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from sentence_transformers import SentenceTransformer
import pandas as pd
import logging
from datetime import datetime
import json
import re
import time
import numpy as np
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler('framework.log'), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

class SelfHealingFramework:
    def __init__(self, mapping_file_path: str):
        self.driver = None
        self.mapping_file_path = mapping_file_path
        self.mappings = self._load_mappings(mapping_file_path)
        self.healing_history = {'healed_elements': [], 'failures': []}
        
        # Initialize AI models
        self.action_model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')
        self.healing_model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')
        logger.info("AI models loaded successfully")

    def _load_mappings(self, file_path: str) -> dict:
        """Load BDD step to element mappings from CSV"""
        try:
            df = pd.read_csv(file_path)
            return {
                row['BDD Step'].strip(): {
                    'element_id': row['element_id'].strip(),
                    'locator_strategies': self._generate_locator_strategies(row['element_id'].strip()),
                    'context': self._create_element_context(row['BDD Step'], row['element_id'])
                }
                for _, row in df.iterrows()
            }
        except Exception as e:
            logger.error(f"Failed to load mappings: {str(e)}")
            return {}

    def _save_mappings(self):
        """Save updated mappings back to CSV file"""
        try:
            # Create DataFrame from current mappings
            data = []
            for bdd_step, info in self.mappings.items():
                data.append({
                    'BDD Step': bdd_step,
                    'Element ID': info['element_id']
                })
            
            df = pd.DataFrame(data)
            
            # Create backup of original file
            backup_path = f"{self.mapping_file_path}.bak"
            if os.path.exists(self.mapping_file_path):
                os.replace(self.mapping_file_path, backup_path)
            
            # Save new mappings
            df.to_csv(self.mapping_file_path, index=False)
            logger.info(f"Successfully updated mappings file: {self.mapping_file_path}")
            
        except Exception as e:
            logger.error(f"Failed to save mappings: {str(e)}")
            raise

    def _update_element_id(self, bdd_step: str, new_element_id: str):
        """Update the element ID in mappings and regenerate strategies"""
        if bdd_step in self.mappings:
            self.mappings[bdd_step]['element_id'] = new_element_id
            self.mappings[bdd_step]['locator_strategies'] = self._generate_locator_strategies(new_element_id)
            self.mappings[bdd_step]['context'] = self._create_element_context(
                bdd_step, new_element_id
            )

    def _generate_locator_strategies(self, element_id: str) -> dict:
        """Generate locator strategies, including split ID parts (e.g., 'input-email' -> 'email')"""
        id_parts = re.split(r'[-_]', element_id)  # Split by hyphens/underscores
        strategies = {
            'id': element_id,
            'name': f'//*[@name="{element_id}"]',
            'css': f'#{element_id}',
            'xpath': f'//*[@id="{element_id}"]',
            'partial_id': f'//*[contains(@id, "{element_id}")]',
            'placeholder': f'//*[@placeholder="{element_id}"]',
            'aria_label': f'//*[@aria-label="{element_id}"]',
            'type': self._guess_element_type(element_id),
            'value': f'//*[@value="{element_id}"]',
            'role': f'//*[@role="{element_id}"]',
            'data-testid': f'//*[@data-testid="{element_id}"]'
        }
        # Add strategies for ID parts (e.g., "email" from "input-email")
        for part in id_parts:
            strategies[f'partial_id_{part}'] = f'//*[contains(@id, "{part}")]'
            strategies[f'name_{part}'] = f'//*[@name="{part}"]'
        return strategies

    def _guess_element_type(self, element_id: str) -> str:
        """Guess element type based on ID patterns"""
        if 'checkbox' in element_id.lower():
            return '//*[@type="checkbox"]'
        if 'radio' in element_id.lower():
            return '//*[@type="radio"]'
        if 'password' in element_id.lower():
            return '//*[@type="password"]'
        if 'email' in element_id.lower():
            return '//*[@type="email"]'
        return f'//*[@id="{element_id}"]'

    def _create_element_context(self, bdd_step: str, element_id: str) -> str:
        """Create semantic context with BDD keywords and split ID parts"""
        # Extract action keywords (e.g., "enter", "email")
        step_keywords = re.findall(r'\b(click|enter|select|verify|password|email|username)\b', bdd_step, re.IGNORECASE)
        # Split element ID into parts (e.g., "input-email" -> ["input", "email"])
        id_keywords = re.split(r'[-_]', element_id)
        return f"{' '.join(step_keywords + id_keywords)} element"

    def execute_all_steps(self, delay=1.5):
        """Execute all test steps with AI-powered healing"""
        for bdd_step, element_info in self.mappings.items():
            action = self._determine_action_with_ai(bdd_step)
            logger.info(f"Executing: {bdd_step} - Action: {action}")
            
            try:
                element = self.find_element(bdd_step)
                if not element:
                    raise ValueError("Element not found after healing attempts")
                
                time.sleep(delay)
                self._perform_action(element, action, bdd_step)
                logger.info(f"Successfully executed: {bdd_step}")
                
            except Exception as e:
                logger.error(f"Failed to execute {bdd_step}: {str(e)}")
                self._record_failure(bdd_step, str(e))

    def _determine_action_with_ai(self, bdd_step: str) -> str:
        """Enhanced action detection with MPNet model"""
        action_descriptions = {
            'click': "User interaction with clickable elements like buttons or links",
            'input': "Text entry into form fields or text areas",
            'verify': "Visual confirmation of element presence or state",
            'select': "Choosing options from dropdown menus",
            'checkbox': "Toggling binary state elements",
            'radio': "Selecting exclusive options from a group"
        }
        
        # Encode BDD step and action descriptions
        bdd_embedding = self.action_model.encode([bdd_step])
        action_embeddings = self.action_model.encode(list(action_descriptions.values()))
        
        # Calculate cosine similarities
        similarities = {}
        for idx, (action, _) in enumerate(action_descriptions.items()):
            similarities[action] = np.dot(bdd_embedding, action_embeddings[idx].T).item()
        
        return max(similarities, key=similarities.get)

    def _perform_action(self, element, action: str, bdd_step: str):
        """Execute action with validation and state management"""
        if action == 'click':
            self._safe_click(element)
        elif action == 'input':
            self._handle_input(element, bdd_step)
        elif action == 'verify':
            self._verify_element(element)
        elif action == 'select':
            self._handle_dropdown(element, bdd_step)
        elif action == 'checkbox':
            self._handle_checkbox(element, bdd_step)
        elif action == 'radio':
            self._handle_radio(element)

    def _safe_click(self, element):
        """Click element with validation"""
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
        
        try:
            WebDriverWait(self.driver, 10).until(
                lambda d: element.is_enabled() and element.is_displayed()
            )
            element.click()
        except:
            self.driver.execute_script("arguments[0].click();", element)

    def _handle_input(self, element, bdd_step):
        """Handle text input with context-aware values"""
        if "password" in bdd_step.lower():
            value = "securePassword123!"
        elif "email" in bdd_step.lower():
            value = "test@example.com"
        else:
            value = "default_input"
        
        element.clear()
        element.send_keys(value)

    def _verify_element(self, element):
        """Verify element visibility and presence"""
        WebDriverWait(self.driver, 10).until(
            EC.visibility_of(element)
        )
        logger.info(f"Verified visibility of element: {element}")

    def _handle_dropdown(self, element, bdd_step):
        """Handle both <select> and custom dropdowns (e.g., div/input)"""
        tag_name = element.tag_name
        option_text = re.search(r"choose the (.+) option", bdd_step, re.IGNORECASE).group(1)

        if tag_name == 'select':
            Select(element).select_by_visible_text(option_text)
        else:
            # Handle custom dropdown (e.g., click to expand and select)
            element.click()
            time.sleep(0.5)
            option = self.driver.find_element(
                By.XPATH, f"//*[contains(text(), '{option_text}')]"
            )
            option.click()

    def _handle_checkbox(self, element, bdd_step):
        """Robust checkbox handling with multiple interaction methods"""
        desired_state = 'uncheck' not in bdd_step.lower()
        current_state = element.is_selected()
        
        if current_state != desired_state:
            # Try standard click
            try:
                self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
                WebDriverWait(self.driver, 5).until(EC.element_to_be_clickable(element))
                element.click()
            except Exception as e:
                # Fallback to JavaScript click
                self.driver.execute_script("arguments[0].checked = arguments[1];", element, desired_state)
            
            # Verify state after interaction
            if element.is_selected() != desired_state:
                raise ValueError(f"Failed to {'check' if desired_state else 'uncheck'} checkbox")

    def _handle_radio(self, element):
        """Enhanced radio button selection with better locating"""
        # First try standard interaction
        try:
            self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
            WebDriverWait(self.driver, 5).until(EC.element_to_be_clickable(element))
            element.click()
        except:
            # Fallback to JavaScript click
            self.driver.execute_script("arguments[0].click();", element)
        
        # Verify selection using radio group
        group_name = element.get_attribute('name')
        selected = self.driver.execute_script(
            f"return document.querySelector('input[name=\"{group_name}\"]:checked').id;"
        )
        if selected != element.get_attribute('id'):
            raise ValueError(f"Failed to select radio button {element.get_attribute('id')}")

    def find_element(self, bdd_step: str, timeout: int = 15):
        """Find element with AI-powered healing"""
        element_info = self.mappings.get(bdd_step)
        if not element_info:
            logger.error(f"No mapping found for: {bdd_step}")
            return None

        try:
            return WebDriverWait(self.driver, timeout).until(
                lambda d: self._find_with_healing(element_info, timeout)
            )
        except Exception as e:
            logger.error(f"Element location failed: {bdd_step} - {str(e)}")
            return None

    def _find_with_healing(self, element_info: dict, timeout: int):
        """Element location with expanded locator strategies"""
        strategies = [
            'id', 'name', 'css', 'xpath', 'partial_id', 'placeholder', 'aria_label',
            'type', 'value', 'role', 'data-testid', 'partial_id_email', 'name_email'
        ]
        for strategy in strategies:
            locator = element_info['locator_strategies'].get(strategy)
            if locator:
                try:
                    return WebDriverWait(self.driver, timeout/2).until(
                        EC.presence_of_element_located((getattr(By, strategy.upper()), locator))
                    )
                except:
                    continue
        return self._ai_heal_element(element_info)

    def _ai_heal_element(self, element_info: dict):
        """Element healing with mpnet-base-v2 model"""
        original_context = element_info['context']
        page_elements = self._get_page_elements()
        
        # Encode contexts using mpnet-base-v2
        original_embed = self.healing_model.encode([original_context])
        page_contexts = [e['context'] for e in page_elements]
        page_embeddings = self.healing_model.encode(page_contexts)
        
        # Calculate similarities and convert to native Python types
        similarities = np.inner(original_embed, page_embeddings)[0]
        best_idx = np.argmax(similarities)
        best_match = page_elements[best_idx]
        similarity_percent = float(round(similarities[best_idx] * 100, 2))
        
        # Log detailed analysis
        logger.info(f"\n{'='*40}\nHealing Analysis for: {original_context}")
        for idx, (elem, sim) in enumerate(zip(page_elements, similarities)):
            logger.info(f"Match {idx+1}: {round(float(sim)*100, 2)}% - {elem['context']}")
        logger.info(f"{'='*40}\nBest match: {similarity_percent}% - {best_match['context']}\n{'='*40}")
        
        if similarity_percent > 45:
            self._update_healing_history(element_info, best_match, similarity_percent)
            return best_match['element']
        
        logger.error("AI healing failed - no suitable match found")
        return None

    def _get_page_elements(self) -> list:
        """Collect elements with additional context (e.g., role, data-testid)"""
        elements = []
        for elem in self.driver.find_elements(By.XPATH, "//*"):
            attrs = {
                'id': elem.get_attribute('id'),
                'name': elem.get_attribute('name'),
                'placeholder': elem.get_attribute('placeholder'),
                'aria-label': elem.get_attribute('aria-label'),
                'type': elem.get_attribute('type'),
                'value': elem.get_attribute('value'),
                'role': elem.get_attribute('role'),
                'data-testid': elem.get_attribute('data-testid'),
                'text': elem.text[:30]
            }
            context = f"{elem.tag_name} element: " + \
                     ", ".join([f"{k}={v}" for k, v in attrs.items() if v])
            elements.append({'element': elem, 'context': context})
        return elements

    def _update_healing_history(self, original: dict, new_element: dict, similarity: float):
        """Record healing details with similarity score"""
        # Convert numpy float to Python float for JSON serialization
        similarity = float(similarity)
        new_id = new_element['element'].get_attribute('id') or "generated_id"
        
        # Find the BDD step associated with this element
        bdd_step = next(
            (step for step, info in self.mappings.items() if info['element_id'] == original['element_id']),
            None
        )
        
        if bdd_step:
            # Update the mapping with new element ID
            self._update_element_id(bdd_step, new_id)
            
            # Save the updated mappings to CSV
            try:
                self._save_mappings()
            except Exception as e:
                logger.error(f"Failed to update mappings file: {str(e)}")
                return
            
            self.healing_history['healed_elements'].append({
                'timestamp': datetime.now().isoformat(),
                'original_id': original['element_id'],
                'new_id': new_id,
                'similarity_score': similarity,
                'best_match_context': new_element['context']
            })
            logger.info(f"Updated mapping for '{bdd_step}' with similarity: {similarity}%")

    def _record_failure(self, bdd_step: str, error: str):
        """Record failure details"""
        self.healing_history['failures'].append({
            'timestamp': datetime.now().isoformat(),
            'step': bdd_step,
            'error': error
        })

    def generate_report(self) -> dict:
        """Generate comprehensive test report with safety checks"""
        try:
            healed_elements = self.healing_history.get('healed_elements', [])
            total_healed = len(healed_elements)
            
            # Calculate average similarity safely
            avg_sim = 0.0
            if total_healed > 0:
                try:
                    total_score = sum(e.get('similarity_score', 0) for e in healed_elements)
                    avg_sim = round(total_score / total_healed, 2)
                except Exception as e:
                    logger.error(f"Error calculating similarity: {str(e)}")
                    avg_sim = 0.0

            return {
                'metadata': {
                    'timestamp': datetime.now().isoformat(),
                    'total_steps': len(self.mappings),
                    'successful_steps': len(self.mappings) - len(self.healing_history.get('failures', [])),
                    'healed_elements': total_healed,
                    'average_similarity': avg_sim
                },
                'details': self.healing_history.copy()
            }
        except Exception as e:
            logger.error(f"Report generation failed: {str(e)}")
            return {
                'metadata': {
                    'timestamp': datetime.now().isoformat(),
                    'error': 'Failed to generate complete report'
                }
            }

    def save_report(self, filename="healing_report.json"):
        """Robust report saving with atomic write"""
        try:
            report_data = self.generate_report()
            
            # Create temporary file
            temp_filename = f"{filename}.tmp"
            with open(temp_filename, 'w') as f:
                json.dump(report_data, f, indent=2)
            
            # Replace original file atomically
            if os.path.exists(filename):
                os.replace(temp_filename, filename)
            else:
                os.rename(temp_filename, filename)
                
            logger.info(f"Report saved to {filename}")
        except Exception as e:
            logger.error(f"Failed to save report: {str(e)}")
            if os.path.exists(temp_filename):
                os.remove(temp_filename)

    def start_browser(self, url: str, headless: bool = False):
        """Initialize browser session"""
        options = webdriver.ChromeOptions()
        if headless:
            options.add_argument("--headless=new")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-dev-shm-usage")
        
        self.driver = webdriver.Chrome(options=options)
        self.driver.get(url)
        logger.info(f"Browser initialized with URL: {url}")

    def shutdown(self):
        """Graceful framework shutdown"""
        if self.driver:
            self.driver.quit()
            logger.info("Browser session terminated")

if __name__ == "__main__":
    framework = SelfHealingFramework("./mapping.csv")
    try:
        framework.start_browser("http://127.0.0.1:5587/htmlexamples/htmlexamples/index.html")
        framework.execute_all_steps()
        framework.save_report()
    except Exception as e:
        logger.error(f"Critical error: {str(e)}")
    finally:
        framework.shutdown()