import re
import torch
from sentence_transformers import SentenceTransformer, util

# Load SBERT model
model = SentenceTransformer("all-MiniLM-L6-v2")

# File paths (update accordingly)
bdd_file = "./bdd_features/login.feature"   
pom_file = "./pom_files/LoginPage.java" 
output_file = "bdd_pom_mapping.csv"

# Step 1: Extract BDD Steps
def extract_bdd_steps(file_path):
    bdd_steps = []
    with open(file_path, "r", encoding="utf-8") as file:
        for line in file:
            line = line.strip()
            if line.startswith(("Given", "When", "Then", "And", "But")):
                bdd_steps.append(line)
    return bdd_steps

# Step 2: Extract Locators & Page URL from POM
def extract_pom_details(file_path):
    locators = {}
    page_url = None
    
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()

        # Extract locators from @FindBy annotations
        findby_matches = re.findall(r'@FindBy\((.*?)\)\s+WebElement\s+(\w+);', content)
        for match in findby_matches:
            locator_type, locator_value = re.findall(r'(\w+)\s*=\s*"([^"]+)"', match[0])[0]
            locators[match[1]] = f"{locator_type}={locator_value}"

        # Extract page URL from driver.get(...)
        url_match = re.search(r'driver\.get\("(.*?)"\)', content)
        if url_match:
            page_url = url_match.group(1)

    return locators, page_url

# Step 3: Match BDD Steps to Locators Using SBERT
def match_bdd_to_locators(bdd_steps, locators):
    pom_texts = list(locators.keys())
    pom_embeddings = model.encode(pom_texts, convert_to_tensor=True)
    
    mapping = []
    for step in bdd_steps:
        step_embedding = model.encode(step, convert_to_tensor=True)
        
        # Compute similarity
        similarities = util.pytorch_cos_sim(step_embedding, pom_embeddings)[0]
        best_match_idx = torch.argmax(similarities).item()
        best_match = pom_texts[best_match_idx]
        
        # Get the best matching locator
        matched_locator = locators.get(best_match, "Not Found")
        mapping.append([step, matched_locator])

    return mapping

# Step 4: Format the output in the requested structure and save
def format_and_save_output(bdd_steps, mapping, page_url, file_path):
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(f"Page URL: {page_url}\n\n")
        file.write(f"Feature: {bdd_file.split('/')[-1].replace('.feature', '')}\n\n")
        file.write(f"Scenario: Successful login with valid credentials\n")
        for i, (step, locator) in enumerate(mapping):
            if i == 0:
                file.write(f"    Given I am on the login page\n")
            else:
                file.write(f"    {step} , {locator}\n")
        file.write(f"    Then I should see the dashboard , id=\"dashboard\"\n")

# Execute the mapping and format the output
bdd_steps = extract_bdd_steps(bdd_file)
locators, page_url = extract_pom_details(pom_file)
mapping = match_bdd_to_locators(bdd_steps, locators)
format_and_save_output(bdd_steps, mapping, page_url, output_file)

print(f"Formatted output saved to {output_file}")
