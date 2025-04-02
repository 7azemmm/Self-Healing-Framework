from selenium import webdriver
from selenium.webdriver.common.by import By
import pandas as pd
import re
import time
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class BddElementFinder:
    def __init__(self):
        self.driver = webdriver.Chrome()
        self.vectorizer = TfidfVectorizer().fit_transform

    def _find_elements(self, xpaths, target, score_base):
        """Generic method to find elements based on XPath list and assign scores."""
        elements = {}
        for idx, xpath in enumerate(xpaths):
            try:
                found = self.driver.find_elements(By.XPATH, xpath)
                for elem_idx, elem in enumerate(found):
                    key = f'element_{idx}_{elem_idx}'
                    elements[key] = {
                        'element': elem,
                        'attributes': self._get_element_attributes(elem),
                        'score': score_base - (idx * 0.1)  # Penalize lower-priority matches
                    }
            except Exception as e:
                print(f"Error finding elements with XPath: {xpath}\n{e}")
        return elements

    def _find_by_button_attributes(self, target):
        """Find button elements using various strategies."""
        button_xpaths = [
            f"//button[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'{target.lower()}')]",
            f"//input[@type='button' or @type='submit'][contains(translate(@value,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'{target.lower()}')]",
            f"//*[@role='button'][contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'{target.lower()}')]",
            f"//*[contains(@class, 'btn') or contains(@class, 'button')][contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'{target.lower()}')]"
        ]
        return self._find_elements(button_xpaths, target, 0.9)

    def _find_by_input_attributes(self, target):
        """Find input elements using various strategies."""
        input_xpaths = [
            f"//input[contains(translate(@name,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'{target.lower()}')]",
            f"//input[contains(translate(@id,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'{target.lower()}')]",
            f"//input[contains(translate(@placeholder,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'{target.lower()}')]",
            f"//label[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'{target.lower()}')]//input",
            f"//input[contains(translate(@aria-label,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'{target.lower()}')]"
        ]
        return self._find_elements(input_xpaths, target, 0.9)

    def _get_element_attributes(self, element):
        """Extract all attributes from an element."""
        try:
            return {
                'id': element.get_attribute('id'),
                'name': element.get_attribute('name'),
                'class': element.get_attribute('class'),
                'type': element.get_attribute('type'),
                'value': element.get_attribute('value'),
                'text': element.text,
                'tag': element.tag_name,
                'placeholder': element.get_attribute('placeholder')
            }
        except:
            return {}

    def find_possible_elements(self, bdd_step, url):
        """Find elements for a given BDD step."""
        self.driver.get(url)
        time.sleep(2)  # Allow time for the page to load

        action_type, target = self._analyze_bdd_step(bdd_step)
        if not target:
            print(f"Could not extract target from BDD step: {bdd_step}")
            return {}

        if action_type == "click":
            return self._find_by_button_attributes(target)
        elif action_type == "input":
            return self._find_by_input_attributes(target)
        else:
            print(f"Unknown action type: {action_type}")
            return {}

    def _analyze_bdd_step(self, bdd_step):
        """Extract action type and target from a BDD step."""
        bdd_lower = bdd_step.lower()
        if "click" in bdd_lower:
            match = re.search(r"click(?:s)?(?:\s+the)?\s+(.+?)(?:\s+button)?", bdd_lower)
            return "click", match.group(1) if match else ""
        elif "enter" in bdd_lower:
            match = re.search(r"enter(?:s)?(?:\s+the)?(?:\s+their)?\s+(.+?)$", bdd_lower)
            return "input", match.group(1) if match else ""
        return "unknown", ""

    def close(self):
        """Close the browser."""
        self.driver.quit()

def analyze_and_update_bdd_steps(existing_csv_path, new_bdd_steps):
    finder = BddElementFinder()
    url = "http://127.0.0.1:5500/index.html"  # Replace with your app's URL
    new_mappings = []

    try:
        for step in new_bdd_steps:
            print(f"\nProcessing BDD Step: {step}")
            elements = finder.find_possible_elements(step, url)
            if elements:
                best_match = max(elements.values(), key=lambda x: x['score'])
                element_id = best_match['attributes']['id']
                if element_id:
                    new_mappings.append({'BDD Step': step, 'Element ID': element_id})
                    print(f"Best match ID: {element_id}")
                else:
                    print("No ID found for best match.")
            else:
                print("No elements found.")

        if new_mappings:
            df_existing = pd.read_csv(existing_csv_path)
            df_new = pd.DataFrame(new_mappings)
            df_updated = pd.concat([df_existing, df_new], ignore_index=True)
            df_updated.to_csv(existing_csv_path, index=False)
            print("Updated CSV with new mappings.")
    finally:
        finder.close()

# Example usage
new_steps = [
    
    "When the user enters their address",
    "When the user clicks submit button"
]
analyze_and_update_bdd_steps('./bdd_element_mapping.csv', new_steps)
