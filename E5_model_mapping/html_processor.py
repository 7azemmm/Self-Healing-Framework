# from bs4 import BeautifulSoup
# import os

# def process_html(directory_path):
#     html_elements = {}
#     for file_name in os.listdir(directory_path):
#         if file_name.endswith(".html"):
#             with open(os.path.join(directory_path, file_name), "r", encoding="utf-8") as file:
#                 soup = BeautifulSoup(file, "html.parser")
            
#             # Extract elements of interest
#             elements = []
#             for tag in soup.find_all(["button", "input", "a", "div", "span"]):
#                 elements.append({
#                     "content": str(tag),
#                     "label": tag.get("id") or tag.get("name") or tag.text.strip()
#                 })
#             html_elements[file_name] = elements
#     return html_elements



# from bs4 import BeautifulSoup
# import os
# from shared import tokenizer, model
# import torch

# def extract_context(soup):
#     """
#     Extract context from an HTML page.
#     """
#     if "user-login-form" in str(soup):
#         return "user login"
#     elif "admin-login-form" in str(soup):
#         return "admin login"
#     else:
#         return "unknown"

# def process_html(directory_path):
#     html_pages = {}
#     for file_name in os.listdir(directory_path):
#         if file_name.endswith(".html"):
#             with open(os.path.join(directory_path, file_name), "r", encoding="utf-8") as file:
#                 soup = BeautifulSoup(file, "html.parser")
            
#             # Extract context
#             context = extract_context(soup)
            
#             # Extract elements of interest
#             elements = []
#             for tag in soup.find_all(["button", "input", "a", "div", "span"]):
#                 role = tag.name  # Role of the element (e.g., "button", "input")
#                 label = tag.get("id") or tag.get("name") or tag.text.strip()  # Label of the element
#                 embedding = get_embedding(label)  # Generate embedding for the element label
#                 elements.append({
#                     "content": str(tag),
#                     "role": role,
#                     "label": label,
#                     "embedding": embedding
#                 })
            
#             # Generate embedding for the entire HTML page
#             page_text = soup.get_text()
#             page_embedding = get_embedding(page_text)
#             html_pages[file_name] = {
#                 "context": context,
#                 "elements": elements,
#                 "embedding": page_embedding
#             }
#     return html_pages

# def get_embedding(text):
#     inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
#     with torch.no_grad():
#         outputs = model(**inputs)
#     return outputs.last_hidden_state.mean(dim=1)  # Average pooling

# from bs4 import BeautifulSoup
# import os
# from shared import tokenizer, model
# import torch

# def process_html(directory_path):
#     html_pages = {}
#     for file_name in os.listdir(directory_path):
#         if file_name.endswith(".html"):
#             with open(os.path.join(directory_path, file_name), "r", encoding="utf-8") as file:
#                 soup = BeautifulSoup(file, "html.parser")
            
#             # Extract elements of interest
#             elements = []
#             for tag in soup.find_all(["button", "input", "a", "div", "span"]):
#                 # Extract all attributes
#                 attributes = {
#                     "role": tag.name,  # Role of the element (e.g., "button", "input")
#                     "id": tag.get("id"),
#                     "name": tag.get("name"),
#                     "type": tag.get("type"),
#                     "value": tag.get("value"),  # Add value attribute
#                     "class": tag.get("class"),
#                     "text": tag.text.strip(),  # Visible text
#                     "parent": tag.parent.name if tag.parent else None,  # Parent element
#                     "siblings": [sibling.name for sibling in tag.find_previous_siblings()]  # Sibling elements
#                 }
                
#                 # Create a text representation of the element
#                 element_text = f"{attributes['role']} "
#                 if attributes["id"]:
#                     element_text += f"id={attributes['id']} "
#                 if attributes["name"]:
#                     element_text += f"name={attributes['name']} "
#                 if attributes["type"]:
#                     element_text += f"type={attributes['type']} "
#                 if attributes["value"]:
#                     element_text += f"value={attributes['value']} "
#                 if attributes["class"]:
#                     element_text += f"class={attributes['class']} "
#                 if attributes["text"]:
#                     element_text += f"text={attributes['text']} "
#                 if attributes["parent"]:
#                     element_text += f"parent={attributes['parent']} "
#                 if attributes["siblings"]:
#                     element_text += f"siblings={attributes['siblings']} "
                
#                 # Generate embedding for the element
#                 embedding = get_embedding(element_text)
#                 elements.append({
#                     "content": str(tag),
#                     "attributes": attributes,
#                     "embedding": embedding
#                 })
            
#             # Generate embedding for the entire HTML page
#             page_text = soup.get_text()
#             page_embedding = get_embedding(page_text)
#             html_pages[file_name] = {
#                 "elements": elements,
#                 "embedding": page_embedding
#             }
#     return html_pages

# def get_embedding(text):
#     inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
#     with torch.no_grad():
#         outputs = model(**inputs)
#     return outputs.last_hidden_state.mean(dim=1)  # Average pooling











# from bs4 import BeautifulSoup
# import os
# from shared import tokenizer, model
# import torch
# from transformers import pipeline

# def process_html(directory_path):
#     """
#     Process HTML files in a directory, extract elements, and generate embeddings and semantic descriptions.
#     Focuses only on interactive elements (e.g., input, select, button).
#     """
#     html_pages = {}
#     try:
#         summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
#     except Exception as e:
#         print(f"Failed to load summarization model: {e}")
#         summarizer = None  # Fallback to no summarization

#     for file_name in os.listdir(directory_path):
#         if file_name.endswith(".html"):
#             with open(os.path.join(directory_path, file_name), "r", encoding="utf-8") as file:
#                 soup = BeautifulSoup(file, "html.parser")
            
#             # Extract interactive elements of interest
#             elements = []
#             for tag in soup.find_all(["input", "select", "button", "textarea"]):  # Focus on interactive elements
#                 # Extract attributes
#                 attributes = {
#                     "role": tag.name,
#                     "id": tag.get("id"),
#                     "name": tag.get("name"),
#                     "type": tag.get("type"),
#                     "value": tag.get("value"),
#                     "class": tag.get("class"),
#                     "text": tag.text.strip(),
#                     "placeholder": tag.get("placeholder", ""),  # Include placeholder
#                     "parent": tag.parent.name if tag.parent else None,
#                     "siblings": [sibling.name for sibling in tag.find_previous_siblings()]
#                 }
                
#                 # Create a text representation of the element
#                 element_text = (
#                     f"{attributes['role']} "
#                     f"id={attributes['id']} "
#                     f"name={attributes['name']} "
#                     f"type={attributes['type']} "
#                     f"value={attributes['value']} "
#                     f"text={attributes['text']} "
#                     f"placeholder={attributes['placeholder']} "
#                     f"parent={attributes['parent']} "
#                     f"siblings={attributes['siblings']} "
#                 )
                
#                 # Generate embedding for the element
#                 embedding = get_embedding(element_text)
#                 description = generate_semantic_description(element_text, summarizer)  # Generate semantic description
#                 elements.append({
#                     "content": str(tag),
#                     "attributes": attributes,
#                     "embedding": embedding,
#                     "description": description
#                 })
            
#             # Generate embedding for the entire HTML page
#             page_text = soup.get_text()
#             page_embedding = get_embedding(page_text)
#             page_description = generate_semantic_description(page_text, summarizer)  # Generate semantic description
#             html_pages[file_name] = {
#                 "elements": elements,
#                 "embedding": page_embedding,
#                 "description": page_description
#             }
    
#     return html_pages

# def get_embedding(text):
#     """
#     Generate embeddings for a given text using the E5 model.
#     """
#     inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
#     with torch.no_grad():
#         outputs = model(**inputs)
#     return outputs.last_hidden_state.mean(dim=1)  # Average pooling

# def generate_semantic_description(text, summarizer):
#     """
#     Generate a semantic description of a text using a summarization model.
#     """
#     if summarizer:
#         input_length = len(text.split())
#         max_length = min(50, input_length)
#         min_length = min(25, max_length // 2)
#         description = summarizer(text, max_length=max_length, min_length=min_length, do_sample=False)[0]['summary_text']
#         return description
#     else:
#         return "No description available"






from bs4 import BeautifulSoup
import os
from shared import tokenizer, model
import torch
from transformers import pipeline

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
            for tag in soup.find_all(interactive_elements):
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

                # Handle <option> elements
                parent_select = None
                if tag.name == "option":
                    parent_select = tag.find_parent("select")
                    if parent_select:
                        attributes.update({
                            "parent_select_id": parent_select.get("id"),
                            "parent_select_name": parent_select.get("name"),
                            "option_value": tag.get("value"),
                            "option_text": tag.text.strip()
                        })

                # Generate XPath and CSS selector for the element
                attributes["xpath_absolute"] = get_xpath(tag, absolute=True)
                attributes["xpath_relative"] = get_xpath(tag, absolute=False)
                attributes["css_selector"] = (
                    f"select#{parent_select.get('id')} option[value='{tag.get('value')}']" 
                    if (tag.name == "option" and parent_select) 
                    else get_css_selector(tag)
                )

                # Create a text representation of the element
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
                    f"xpath_absolute={attributes['xpath_absolute']} "
                    f"xpath_relative={attributes['xpath_relative']} "
                    f"css_selector={attributes['css_selector']} "
                )
                if tag.name == "option":
                    element_text += (
                        f"option_value={attributes.get('option_value', '')} "
                        f"parent_select={attributes.get('parent_select_id', '')} "
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