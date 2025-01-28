
# from torch.nn.functional import cosine_similarity
# from shared import tokenizer, model
# import torch

# def map_bdd_to_html(bdd_scenarios, html_pages):
#     mappings = []
#     for scenario in bdd_scenarios:
#         best_matches = []
#         for page, page_data in html_pages.items():
#             # Match BDD context to HTML context
#             if scenario["context"] == page_data["context"]:
#                 # Match BDD scenario to HTML page based on semantic similarity
#                 scenario_embedding = scenario["embedding"]
#                 page_embedding = page_data["embedding"]
#                 similarity = cosine_similarity(scenario_embedding, page_embedding).item()
                
#                 if similarity > 0.7:  # Threshold for matching
#                     for element in page_data["elements"]:
#                         # Match BDD target to HTML element based on role and semantic similarity
#                         target_embedding = get_embedding(scenario["scenario"])
#                         element_embedding = element["embedding"]
#                         element_similarity = cosine_similarity(target_embedding, element_embedding).item()
                        
#                         if element_similarity > 0.7:  # Threshold for matching
#                             best_matches.append((page, element))
#         mappings.append({"scenario": scenario["scenario"], "matches": best_matches})
#     return mappings

# def get_embedding(text):
#     inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
#     with torch.no_grad():
#         outputs = model(**inputs)
#     return outputs.last_hidden_state.mean(dim=1)  # Average pooling


# from torch.nn.functional import cosine_similarity
# from shared import tokenizer, model
# import torch

# def map_bdd_to_html(bdd_scenarios, html_pages):
#     mappings = []
#     for scenario in bdd_scenarios:
#         best_matches = []
#         for page, page_data in html_pages.items():
#             # Match BDD context to HTML context
#             if scenario["context"] == page_data["context"]:
#                 # Match BDD scenario to HTML page based on semantic similarity
#                 scenario_embedding = scenario["embedding"]
#                 page_embedding = page_data["embedding"]
#                 similarity = cosine_similarity(scenario_embedding, page_embedding).item()
                
#                 if similarity > 0.8:  # Increased threshold for matching
#                     # Split the scenario into steps
#                     steps = scenario["scenario"].split("\n")
#                     for step in steps:
#                         step = step.strip()
#                         # Only include "When" and "And" steps (actions)
#                         if step.lower().startswith(("when", "and")):
#                             step_embedding = get_embedding(step)
#                             best_element = None
#                             best_similarity = -1  # Initialize with a low value
                            
#                             # Find the best matching element for the step
#                             for element in page_data["elements"]:
#                                 # Role-based filtering
#                                 if "select" in step.lower() and element["role"] not in ["select", "input"]:
#                                     continue  # Skip non-matching roles
#                                 if "enter" in step.lower() and element["role"] != "input":
#                                     continue  # Skip non-input elements
#                                 if "click" in step.lower() and element["role"] != "button":
#                                     continue  # Skip non-button elements
                                
#                                 element_embedding = element["embedding"]
#                                 element_similarity = cosine_similarity(step_embedding, element_embedding).item()
                                
#                                 # Update best element if this one is better
#                                 if element_similarity > best_similarity:
#                                     best_similarity = element_similarity
#                                     best_element = element
                            
#                             # Only include the match if similarity exceeds the threshold
#                             if best_similarity > 0.8:  # Increased threshold
#                                 best_matches.append({
#                                     "step": step,
#                                     "page": page,
#                                     "element": best_element
#                                 })
#         mappings.append({"scenario": scenario["scenario"], "matches": best_matches})
#     return mappings

# def get_embedding(text):
#     inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
#     with torch.no_grad():
#         outputs = model(**inputs)
#     return outputs.last_hidden_state.mean(dim=1)  # Average pooling


# from torch.nn.functional import cosine_similarity
# from shared import tokenizer, model
# import torch

# def map_bdd_to_html(bdd_scenarios, html_pages):
#     mappings = []
#     for scenario in bdd_scenarios:
#         best_matches = []
#         best_page = None
#         best_similarity = -1  # Initialize with a low value
        
#         # Find the best matching HTML page for the scenario
#         for page, page_data in html_pages.items():
#             scenario_embedding = scenario["embedding"]
#             page_embedding = page_data["embedding"]
#             similarity = cosine_similarity(scenario_embedding, page_embedding).item()
            
#             if similarity > best_similarity:
#                 best_similarity = similarity
#                 best_page = page
        
#         # Only proceed if a matching page is found
#         if best_page and best_similarity > 0.7:  # Threshold for matching
#             page_data = html_pages[best_page]
#             # Split the scenario into steps
#             steps = scenario["scenario"].split("\n")
#             for step in steps:
#                 step = step.strip()
#                 # Only include "When" and "And" steps (actions)
#                 if step.lower().startswith(("when", "and")):
#                     step_embedding = get_embedding(step)
#                     best_element = None
#                     best_element_similarity = -1  # Initialize with a low value
                    
#                     # Find the best matching element for the step
#                     for element in page_data["elements"]:
#                         # Strict role-based filtering
#                         if "color" in step.lower() and "select" in step.lower():
#                             element_type = element["attributes"].get("type")
#                             element_name = element["attributes"].get("name", "") or ""
#                             if element_type != "radio" or "color" not in element_name.lower():
#                                 continue  # Skip non-color radio buttons
                        
#                         if "size" in step.lower() and "select" in step.lower():
#                             element_type = element["attributes"].get("type")
#                             element_name = element["attributes"].get("name", "") or ""
#                             if element_type != "select" and "size" not in element_name.lower():
#                                 continue  # Skip non-size dropdowns
                        
#                         if "quantity" in step.lower():
#                             element_type = element["attributes"].get("type")
#                             element_name = element["attributes"].get("name", "") or ""
#                             if element_type != "number" and "quantity" not in element_name.lower():
#                                 continue  # Skip non-quantity fields
                        
#                         if "click" in step.lower():
#                             if element["attributes"]["role"] != "button":
#                                 continue  # Skip non-button elements
                        
#                         element_embedding = element["embedding"]
#                         element_similarity = cosine_similarity(step_embedding, element_embedding).item()
                        
#                         # Update best element if this one is better
#                         if element_similarity > best_element_similarity:
#                             best_element_similarity = element_similarity
#                             best_element = element
                    
#                     # Only include the match if similarity exceeds the threshold
#                     if best_element_similarity > 0.7:  # Threshold for matching
#                         best_matches.append({
#                             "step": step,
#                             "page": best_page,
#                             "element": best_element
#                         })
#         mappings.append({"scenario": scenario["scenario"], "matches": best_matches})
#     return mappings

# def get_embedding(text):
#     inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
#     with torch.no_grad():
#         outputs = model(**inputs)
#     return outputs.last_hidden_state.mean(dim=1)  # Average pooling

from torch.nn.functional import cosine_similarity
from shared import tokenizer, model
import torch
from fuzzywuzzy import fuzz  # For fuzzy string matching

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
            best_match = None
            best_similarity = -1  # Initialize with a low value

            # Check if the step involves selecting an option from a dropdown
            is_dropdown_selection = (
                "select" in step.lower() and 
                "from" in step.lower() and 
                "dropdown" in step.lower()
            )

            # Find the best matching element across all HTML pages
            for page, page_data in html_pages.items():
                for element in page_data["elements"]:
                    element_embedding = element["embedding"]
                    element_similarity = cosine_similarity(step_embedding, element_embedding).item()

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
                    combined_similarity = (
                        element_similarity * 0.8 +  # Semantic similarity (70% weight)
                        (label_match_score + id_match_score + name_match_score + placeholder_match_score + type_match_score) / 500 * 0.2  # Fuzzy match (20% weight)
                    )

                    # Add bonus for dropdown selection steps
                    if is_dropdown_selection:
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
    return outputs.last_hidden_state.mean(dim=1)  # Average pooling