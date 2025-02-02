import os
import re
import torch
import logging
from sentence_transformers import SentenceTransformer, util

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load SBERT model for NLP-based text similarity
model = SentenceTransformer("all-MiniLM-L6-v2")

# Folder paths (update accordingly)
bdd_folder = "./bdd_features"  # Folder containing feature files
pom_folder = "./pom_files"    # Folder containing POM files
output_txt = "mapping.txt"  # Output mapping file

# Step 1: Extract BDD Steps from a Feature File
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

# Step 2: Extract Locators & Page URL from POM
def extract_pom_details(file_path):
    locators = {}
    page_url = None

    try:
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
    except Exception as e:
        logging.error(f"Error reading file {file_path}: {e}")
    return locators, page_url

# Step 3: Match BDD Steps to Locators Using SBERT
def match_bdd_to_locators(bdd_steps, locators):
    pom_texts = list(locators.keys())
    pom_embeddings = model.encode(pom_texts, convert_to_tensor=True)

    mapping = []
    step_batch = [step for _, step in bdd_steps]
    step_embeddings = model.encode(step_batch, convert_to_tensor=True)

    for idx, (scenario, step) in enumerate(bdd_steps):
        step_embedding = step_embeddings[idx]

        # Compute similarity
        similarities = util.pytorch_cos_sim(step_embedding, pom_embeddings)[0]
        best_match_idx = torch.argmax(similarities).item()
        best_match = pom_texts[best_match_idx]

        # Get the best matching locator
        matched_locator = locators.get(best_match, "Not Found")
        mapping.append([scenario, step, matched_locator])

    return mapping

# Step 4: Process all feature files and save in structured text format
def process_all_features():
    try:
        with open(output_txt, "w", encoding="utf-8") as txtfile:

            # Get list of all feature files
            feature_files = [f for f in os.listdir(bdd_folder) if f.endswith('.feature')]

            for feature_file in feature_files:
                # Match the feature file to the corresponding POM file
                feature_name = feature_file.replace(".feature", "")
                pom_file = f"{feature_name}Page.java"
                pom_file_path = os.path.join(pom_folder, pom_file)

                # Check if corresponding POM file exists
                if os.path.exists(pom_file_path):
                    # Extract BDD steps and POM details
                    bdd_file_path = os.path.join(bdd_folder, feature_file)
                    bdd_steps = extract_bdd_steps(bdd_file_path)
                    locators, page_url = extract_pom_details(pom_file_path)

                    # Write Page URL and Feature Name
                    txtfile.write(f"Page URL: {page_url}\n\n")
                    txtfile.write(f"Feature: {feature_name}\n\n")

                    # Match BDD steps to locators
                    mapping = match_bdd_to_locators(bdd_steps, locators)

                    # Write Scenarios with mapped locators
                    current_scenario = None
                    for scenario, step, locator in mapping:
                        if scenario != current_scenario:
                            txtfile.write(f"Scenario: {scenario}\n")
                            current_scenario = scenario

                        # Append locator
                        step_with_locator = f"{step} , {locator}" if locator != "Not Found" else step
                        txtfile.write(f"    {step_with_locator}\n")

                    txtfile.write("\n")  # Add a newline for separation
                    logging.info(f"Processed {feature_file} -> {pom_file}")
                else:
                    logging.warning(f"No POM file found for {feature_file}, skipping.")
    except Exception as e:
        logging.error(f"Error processing features: {e}")

# Execute the process
process_all_features()
logging.info(f"\nMapping file saved as {output_txt}")