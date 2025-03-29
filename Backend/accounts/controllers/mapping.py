import re
import torch
import logging
from abc import ABC, abstractmethod
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from sentence_transformers import SentenceTransformer, util
from torch.nn.functional import cosine_similarity
from .shared import tokenizer, model
import torch
from fuzzywuzzy import fuzz 
from transformers import pipeline  


class ElementLocators:
    def __init__(self):
        self.id = None
        self.class_name = None
        self.type = None
        self.xpath = None
        self.name = None
        self.original_locator = None

class IFileReader(ABC):
    @abstractmethod
    def read(self, content):
        pass

class BDDReader(IFileReader):
    def read(self, content):
        scenarios = []
        current_scenario = "Unknown Scenario"
        for line in content.split("\n"):
            line = line.strip()
            if line.lower().startswith("scenario:"):
                current_scenario = line.replace("Scenario:", "").strip()
            elif line.startswith(("When", "Then", "And", "But")):
                scenarios.append((current_scenario, line))
        return scenarios

class POMReader(IFileReader):
    def read(self, content):
        locators_dict = {}
        page_url = None
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
        return locators_dict, page_url

class WebScraper:
    def __init__(self):
        self.driver = self._init_driver()

    def _init_driver(self):
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        return webdriver.Chrome(options=chrome_options)

    def scrape_locators(self, url, existing_locators):
        try:
            self.driver.get(url)

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
                            web_element = self.driver.find_element("id", primary_locator[1])
                        elif primary_locator[0] == "name":
                            web_element = self.driver.find_element("name", primary_locator[1])
                        elif primary_locator[0] == "class name":
                            web_element = self.driver.find_element("class name", primary_locator[1])
                        elif primary_locator[0] == "xpath":
                            web_element = self.driver.find_element("xpath", primary_locator[1])
                        else:
                            continue

                        # Extract alternative locators if they are missing
                        if not locators.xpath:
                            locators.xpath = self.get_xpath(web_element)
                        if not locators.name:
                            locators.name = web_element.get_attribute("name")
                        if not locators.class_name:
                            locators.class_name = web_element.get_attribute("class")
                        if not locators.type:
                            locators.type = web_element.get_attribute("type")
                    except Exception as e:
                        logging.warning(f"Could not locate {element_name} on the page: {e}")

            self.driver.quit()
        except Exception as e:
            logging.error(f"Error scraping webpage {url}: {e}")
        return existing_locators

    def get_xpath(self, element):
        return self.driver.execute_script("""
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

class BDDToLocatorMapper:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)

    def match(self, bdd_steps, locators_dict):
        pom_texts = list(locators_dict.keys())
        pom_embeddings = self.model.encode(pom_texts, convert_to_tensor=True)

        mapping = []
        step_batch = [step for _, step in bdd_steps]
        step_embeddings = self.model.encode(step_batch, convert_to_tensor=True)

        for idx, (scenario, step) in enumerate(bdd_steps):
            step_embedding = step_embeddings[idx]
            similarities = util.pytorch_cos_sim(step_embedding, pom_embeddings)[0]
            best_match_idx = torch.argmax(similarities).item()
            best_match = pom_texts[best_match_idx]
            matched_locators = locators_dict.get(best_match)
            mapping.append([scenario, step, matched_locators])

        return mapping


class MappingProcessor:
    def __init__(self):
        self.bdd_reader = BDDReader()
        self.pom_reader = POMReader()
        self.web_scraper = WebScraper()
        self.mapper = BDDToLocatorMapper()

    def format_locators(self, locators):
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
        
        return ", ".join(parts) if parts else "No locators found"

    def process_all_features(self,bdd,test_script):
        outputs = []
        try:
            for feature_file in bdd:
                feature_name = feature_file[0].replace(".feature", "")
                pom_file = f"{feature_name}Page.java"
                print(pom_file)

                if pom_file in test_script:
                    bdd_steps = self.bdd_reader.read(feature_file[1])
                    locators_dict, page_url = self.pom_reader.read(test_script[pom_file])

                    if page_url:
                        locators_dict = self.web_scraper.scrape_locators(page_url, locators_dict)

                    mapping = self.mapper.match(bdd_steps, locators_dict)
                    rows = [["Step", "Page", "ID", "Class", "Name", "Value",
                            "XPath (Absolute)", "XPath (Relative)", "CSS Selector"]]
                    
                    for scenario, step, locators in mapping:
                        page = page_url
                        locator_id = locators.id if locators.id else "N/A"
                        locator_class = locators.class_name if locators.class_name else "N/A"
                        locator_name = locators.name if locators.name else "N/A"
                        locator_value = "N/A"  # Placeholder as per provided example
                        xpath_absolute = locators.xpath if locators.xpath else "N/A"
                        xpath_relative = f'./{xpath_absolute}' if xpath_absolute != "N/A" else "N/A"
                        css_selector = f'#{locator_id}' if locator_id != "N/A" else "N/A"
                        rows.append([
                            step, page, locator_id, locator_class,
                            locator_name, locator_value, xpath_absolute, xpath_relative, css_selector
                        ])
                    outputs.append(rows)
                else:
                    logging.warning(f"No POM file found for {feature_file}, skipping.")
        except Exception as e:
            logging.error(f"Error processing features: {e}")
        return outputs
            
    def process(self,feature,pom):
        output = ""
        bdd_steps = self.bdd_reader.read(feature)
        locators_dict, page_url = self.pom_reader.read(pom)
        if page_url:
            locators_dict = self.web_scraper.scrape_locators(page_url, locators_dict)

        output+= f"Page URL: {page_url}\n\n"
        output+= f"Feature: \n\n"

        mapping = self.mapper.match(bdd_steps, locators_dict)

        rows = [["Step", "Page", "ID", "Class", "Name", "Value",
                "XPath (Absolute)", "XPath (Relative)", "CSS Selector"]]
        
        for scenario, step, locators in mapping:
            page = page_url
                        
            locator_id = locators.id if locators.id else "N/A"
            locator_class = locators.class_name if locators.class_name else "N/A"
            locator_name = locators.name if locators.name else "N/A"
            locator_value = "N/A"  # Placeholder as per provided example
            xpath_absolute = locators.xpath if locators.xpath else "N/A"
            xpath_relative = f'./{xpath_absolute}' if xpath_absolute != "N/A" else "N/A"
            css_selector = f'#{locator_id}' if locator_id != "N/A" else "N/A"
            rows.append([
                step, page, locator_id, locator_class,
                locator_name, locator_value, xpath_absolute, xpath_relative, css_selector
            ])

        return rows



try:
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
except Exception as e:
    print(f"Failed to load summarization model: {e}")
    summarizer = None  # Fallback to no summarization

def map_bdd_to_html(bdd_scenario, html_pages):
    """
    Map a single BDD scenario to HTML elements across multiple pages based on semantic similarity.
    Uses fuzzy matching and semantic embeddings to handle any scenario and HTML structure.
    """
    mappings = []
    scenario_embedding = bdd_scenario["embedding"]
    scenario_description = bdd_scenario["description"]

    print(f"\nProcessing BDD Scenario: {bdd_scenario['scenario']}")
    print(f"Semantic Description: {scenario_description}")

    # Define all possible action keywords
    action_keywords = [
        # Click actions
        "click", "press", "tap", "submit", "select", "choose", "check", "uncheck", "toggle", "hover", "double-click", "right-click",
        # Input actions
        "enter", "type", "input", "fill", "write", "paste", "clear",
        # Navigation actions
        "navigate", "go to", "visit", "open", "close", "refresh", "scroll", "swipe",
        # Selection actions
        "select", "choose", "pick", "deselect",
        # Verification actions
        "verify", "check", "assert", "confirm", "validate", "ensure",
        # Drag and drop actions
        "drag", "drop", "move", "resize",
        # Wait actions
        "wait", "pause", "sleep",
        # Other actions
        "upload", "download", "attach", "detach", "zoom", "pinch", "rotate"
    ]

    # Split the scenario into steps
    steps = bdd_scenario["scenario"].split("\n")
    for step in steps:
        step = step.strip()
        # Only include "When" and "And" steps that contain action keywords
        if step.lower().startswith(("when", "and")) and any(keyword in step.lower() for keyword in action_keywords):
            step_embedding = get_embedding(step)
            step_description = generate_semantic_description(step, summarizer) if summarizer else "No description"
            step_description_embedding = get_embedding(step_description) if step_description != "No description" else None

            best_match = None
            best_similarity = -1  # Initialize with a low value

            # Find the best matching element across all HTML pages
            for page, page_data in html_pages.items():
                for element in page_data["elements"]:
                    element_embedding = element["embedding"]
                    element_description_embedding = get_embedding(element["description"]) if element["description"] != "No description" else None

                    # Combine step and element embeddings with their descriptions (if available)
                    step_similarity = cosine_similarity(step_embedding, element_embedding).item()
                    if step_description_embedding is not None and element_description_embedding is not None:
                        description_similarity = cosine_similarity(step_description_embedding, element_description_embedding).item()
                        combined_similarity = (step_similarity * 0.8) + (description_similarity * 0.2)  # Adjust weights
                    else:
                        combined_similarity = step_similarity  # Skip descriptions if they are generic

                    # Add fuzzy matching for label text, id, name, placeholder, and type
                    attributes = element.get("attributes", {})
                    label_text = attributes.get("text", "") or ""
                    element_id = attributes.get("id", "") or ""
                    element_name = attributes.get("name", "") or ""
                    placeholder = attributes.get("placeholder", "") or ""
                    element_type = attributes.get("type", "") or ""
                    option_value = attributes.get("option_value", "") or ""  # For <option> elements
                    option_text = attributes.get("option_text", "") or ""  # For <option> elements

                    # Calculate fuzzy match scores
                    label_match_score = fuzz.partial_ratio(step.lower(), label_text.lower())
                    id_match_score = fuzz.partial_ratio(step.lower(), element_id.lower())
                    name_match_score = fuzz.partial_ratio(step.lower(), element_name.lower())
                    placeholder_match_score = fuzz.partial_ratio(step.lower(), placeholder.lower())
                    type_match_score = fuzz.partial_ratio(step.lower(), element_type.lower())
                    option_value_match_score = fuzz.partial_ratio(step.lower(), option_value.lower())
                    option_text_match_score = fuzz.partial_ratio(step.lower(), option_text.lower())

                    # Combine semantic similarity with fuzzy match scores
                    combined_similarity += (
                        (label_match_score + id_match_score + name_match_score + placeholder_match_score + type_match_score) / 500 * 0.2  # Fuzzy match (20% weight)
                    )

                    # Add bonus for dropdown selection steps
                    if "select" in step.lower() and "from" in step.lower() and "dropdown" in step.lower():
                        if element["attributes"]["role"] == "option":
                            # Prioritize option text/value matches
                            combined_similarity += (option_value_match_score + option_text_match_score) / 200 * 0.3  # 30% bonus
                        elif element["attributes"]["role"] == "select":
                            # Penalize parent <select> elements for dropdown steps
                            combined_similarity *= 0.5  # Reduce similarity for parent dropdowns

                    # Update best match if this one is better
                    if combined_similarity > best_similarity:
                        best_similarity = combined_similarity
                        best_match = {
                            "step": step,
                            "page": page,
                            "element": {
                                **element,  # Include all element attributes
                                "similarity": combined_similarity  # Add similarity to the element
                            }
                        }

            # Only include the match if similarity exceeds the threshold
            if best_similarity > 0.3:  # Threshold for matching
                # Extract all identifiers from the element
                element_attributes = best_match["element"]["attributes"]
                identifiers = {
                    "id": element_attributes.get("id"),
                    "class": element_attributes.get("class"),
                    "name": element_attributes.get("name"),
                    "xpath_absolute": element_attributes.get("xpath_absolute"),
                    "xpath_relative": element_attributes.get("xpath_relative"),
                    "css_selector": element_attributes.get("css_selector")
                }

                # Add identifiers to the match
                best_match["identifiers"] = identifiers

                # Add the match to the mappings
                mappings.append(best_match)

    # Do NOT sort the mappings by similarity. Keep them in the original order.
    return mappings

def get_embedding(text):
    """
    Generate embeddings for a given text using the E5 model.
    """
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        outputs = model(**inputs)
    return outputs.last_hidden_state.mean(dim=1)  

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