import os
import re
import torch
import logging
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from sentence_transformers import SentenceTransformer, util

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load SBERT model for NLP-based text similarity
model = SentenceTransformer("all-MiniLM-L6-v2")

class ElementLocators:
    def __init__(self):
        self.id = None
        self.class_name = None
        self.type = None
        self.xpath = None
        self.name = None
        self.original_locator = None

def extract_bdd_steps(file_path):
    scenarios = []
    current_scenario = "Unknown Scenario"
    
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            for line in file:
                line = line.strip()
                if line.lower().startswith("scenario:"):
                    current_scenario = line.replace("Scenario:", "").strip()
                elif line.startswith(("When", "Then", "And", "But")):
                    scenarios.append((current_scenario, line))
    except Exception as e:
        logging.error(f"Error reading file {file_path}: {e}")
    return scenarios

def extract_pom_details(file_path):
    locators_dict = {}
    page_url = None

    try:
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()

            # Extract locators from @FindBy annotations
            findby_matches = re.findall(r'@FindBy\((.*?)\)\s+WebElement\s+(\w+);', content)
            for match in findby_matches:
                element_name = match[1]
                locators = ElementLocators()
                
                # Parse all locator attributes from the @FindBy annotation
                locator_attrs = re.findall(r'(\w+)\s*=\s*"([^"]+)"', match[0])
                for attr, value in locator_attrs:
                    if attr.lower() == 'id':
                        locators.id = value
                    elif attr.lower() == 'classname':
                        locators.class_name = value
                    elif attr.lower() == 'xpath':
                        locators.xpath = value
                    elif attr.lower() == 'name':
                        locators.name = value
                    elif attr.lower() == 'type':
                        locators.type = value
                
                locators.original_locator = match[0]
                locators_dict[element_name] = locators

            # Extract page URL from driver.get(...)
            url_match = re.search(r'driver\.get\("(.*?)"\)', content)
            if url_match:
                page_url = url_match.group(1)
    except Exception as e:
        logging.error(f"Error reading file {file_path}: {e}")
    return locators_dict, page_url

def scrape_additional_locators(url, existing_locators):
    try:
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        driver = webdriver.Chrome()
        driver.get(url)

        for element_name, locators in existing_locators.items():
            primary_locator = None
            if locators.id:
                primary_locator = ("id", locators.id)
            elif locators.name:
                primary_locator = ("name", locators.name)
            elif locators.class_name:
                primary_locator = ("class name", locators.class_name)
            elif locators.xpath:
                primary_locator = ("xpath", locators.xpath)

            if primary_locator:
                try:
                    # Find the element on the page using the primary locator
                    if primary_locator[0] == "id":
                        web_element = driver.find_element("id", primary_locator[1])
                    elif primary_locator[0] == "name":
                        web_element = driver.find_element("name", primary_locator[1])
                    elif primary_locator[0] == "class name":
                        web_element = driver.find_element("class name", primary_locator[1])
                    elif primary_locator[0] == "xpath":
                        web_element = driver.find_element("xpath", primary_locator[1])
                    else:
                        continue

                    # Extract an alternative locator from the same element
                    if not locators.xpath:
                        locators.xpath = get_xpath(driver, web_element)  # Function to generate XPath
                    if not locators.name:
                        locators.name = web_element.get_attribute("name")
                    if not locators.class_name:
                        locators.class_name = web_element.get_attribute("class")
                    if not locators.type:
                        locators.type = web_element.get_attribute("type")
                except Exception as e:
                    logging.warning(f"Could not locate {element_name} on the page: {e}")

        driver.quit()
    except Exception as e:
        logging.error(f"Error scraping webpage {url}: {e}")
    return existing_locators

def get_xpath(driver, element):
    """Generates an absolute XPath for a given WebElement"""
    return driver.execute_script("""
        function absoluteXPath(element) {
            var comp, comps = [];
            var parent = null;
            var xpath = '';
            var getPos = function(element) {
                var pos = 1, sibling = element.previousSibling;
                while (sibling) {
                    if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === element.tagName) {
                        pos++;
                    }
                    sibling = sibling.previousSibling;
                }
                return pos;
            };
            if (element instanceof Document) {
                return '/';
            }
            for (; element && !(element instanceof Document); element = element.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? element.host : element.parentNode) {
                comp = comps[comps.length] = {};
                comp.name = element.tagName;
                comp.position = getPos(element);
            }
            for (var i = comps.length - 1; i >= 0; i--) {
                comp = comps[i];
                xpath += '/' + comp.name.toLowerCase() + (comp.position > 1 ? '[' + comp.position + ']' : '');
            }
            return xpath;
        }
        return absoluteXPath(arguments[0]);
    """, element)


def match_bdd_to_locators(bdd_steps, locators_dict):
    pom_texts = list(locators_dict.keys())
    pom_embeddings = model.encode(pom_texts, convert_to_tensor=True)

    mapping = []
    step_batch = [step for _, step in bdd_steps]
    step_embeddings = model.encode(step_batch, convert_to_tensor=True)

    for idx, (scenario, step) in enumerate(bdd_steps):
        step_embedding = step_embeddings[idx]
        similarities = util.pytorch_cos_sim(step_embedding, pom_embeddings)[0]
        best_match_idx = torch.argmax(similarities).item()
        best_match = pom_texts[best_match_idx]
        matched_locators = locators_dict.get(best_match)
        mapping.append([scenario, step, matched_locators])

    return mapping

def format_locators(locators):
    if not isinstance(locators, ElementLocators):
        return "Not Found"
    
    parts = []
    if locators.id:
        parts.append(f"id={locators.id}")
    if locators.class_name:
        parts.append(f"class={locators.class_name}")
    if locators.type:
        parts.append(f"type={locators.type}")
    if locators.xpath:
        parts.append(f"xpath={locators.xpath}")
    if locators.name:
        parts.append(f"name={locators.name}")
    
    return ",".join(parts) if parts else "No locators found"

def process_all_features(bdd_folder="./bdd_features", pom_folder="./pom_files", output_txt="mapping.txt"):
    try:
        with open(output_txt, "w", encoding="utf-8") as txtfile:
            feature_files = [f for f in os.listdir(bdd_folder) if f.endswith('.feature')]

            for feature_file in feature_files:
                feature_name = feature_file.replace(".feature", "")
                pom_file = f"{feature_name}Page.java"
                pom_file_path = os.path.join(pom_folder, pom_file)

                if os.path.exists(pom_file_path):
                    bdd_file_path = os.path.join(bdd_folder, feature_file)
                    bdd_steps = extract_bdd_steps(bdd_file_path)
                    locators_dict, page_url = extract_pom_details(pom_file_path)

                    if page_url:
                        # Scrape additional locators from the webpage
                        locators_dict = scrape_additional_locators(page_url, locators_dict)

                    txtfile.write(f"Page URL: {page_url}\n\n")
                    txtfile.write(f"Feature: {feature_name}\n\n")

                    mapping = match_bdd_to_locators(bdd_steps, locators_dict)

                    current_scenario = None
                    for scenario, step, locators in mapping:
                        if scenario != current_scenario:
                            txtfile.write(f"Scenario: {scenario}\n")
                            current_scenario = scenario

                        formatted_locators = format_locators(locators)
                        txtfile.write(f"    {step}\n    Locators: {formatted_locators}\n\n")

                    txtfile.write("\n")
                    logging.info(f"Processed {feature_file} -> {pom_file}")
                else:
                    logging.warning(f"No POM file found for {feature_file}, skipping.")
    except Exception as e:
        logging.error(f"Error processing features: {e}")

if __name__ == "__main__":
    process_all_features()
    logging.info(f"\nMapping file saved as mapping.txt")