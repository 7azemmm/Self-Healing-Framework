import re
from typing import Tuple, Optional
from selenium.webdriver.remote.webelement import WebElement

def determine_action(bdd_step: str) -> Tuple[Optional[str], Optional[str]]:
    """Determine the action and value from the BDD step description."""
    bdd_step_lower = bdd_step.lower()
    
    if "click" in bdd_step_lower:
        return "click", None
    elif "enter" in bdd_step_lower or "input" in bdd_step_lower:
        match = re.search(r'enter\s+.*?"{1,3}([^"]+)"{1,3}', bdd_step_lower)
        value = match.group(1) if match else ""
        return "input", value
    elif "verify" in bdd_step_lower or "check" in bdd_step_lower:
        return "verify", None
    elif "select" in bdd_step_lower:
        match = re.search(r"select\s+['\"](.+?)['\"]", bdd_step_lower)
        value = match.group(1) if match else ""
        return "select", value
    elif "checkbox" in bdd_step_lower:
        if "check" in bdd_step_lower:
            return "checkbox", "check"
        elif "uncheck" in bdd_step_lower:
            return "checkbox", "uncheck"
    elif "choose" in bdd_step_lower or "radio" in bdd_step_lower:
        match = re.search(r"choose\s+['\"](.+?)['\"]", bdd_step_lower)
        value = match.group(1) if match else ""
        return "radio", value
    
    return None, None

def get_xpath(element: WebElement) -> str:
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