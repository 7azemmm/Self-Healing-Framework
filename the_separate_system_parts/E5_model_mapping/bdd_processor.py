# from transformers import AutoTokenizer, AutoModel
# import torch

# # Load E5 model
# model_name = "intfloat/e5-large-v2"
# tokenizer = AutoTokenizer.from_pretrained(model_name)
# model = AutoModel.from_pretrained(model_name)

# def process_bdd(file_path):
#     with open(file_path, "r") as file:
#         bdd_scenarios = file.readlines()
    
#     embeddings = []
#     for scenario in bdd_scenarios:
#         embeddings.append(get_embedding(scenario))
#     return bdd_scenarios, embeddings

# def get_embedding(text):
#     inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
#     with torch.no_grad():
#         outputs = model(**inputs)
#     return outputs.last_hidden_state.mean(dim=1)  # Average pooling

# from shared import tokenizer, model
# import torch

# def extract_context(scenario):
#     """
#     Extract context from a BDD scenario.
#     """
#     if "user login" in scenario.lower():
#         return "user login"
#     elif "admin login" in scenario.lower():
#         return "admin login"
#     else:
#         return "unknown"

# def process_bdd(file_path):
#     with open(file_path, "r") as file:
#         bdd_scenarios = file.read().split("Scenario:")[1:]  # Split by "Scenario:"
    
#     # Extract context from BDD scenarios
#     parsed_scenarios = []
#     for scenario in bdd_scenarios:
#         context = extract_context(scenario)
#         embedding = get_embedding(scenario)  # Generate embedding for the entire scenario
#         parsed_scenarios.append({
#             "scenario": scenario.strip(),
#             "context": context,
#             "embedding": embedding
#         })
#     return parsed_scenarios

# def get_embedding(text):
#     inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
#     with torch.no_grad():
#         outputs = model(**inputs)
#     return outputs.last_hidden_state.mean(dim=1)  # Average pooling


# from shared import tokenizer, model
# import torch

# def infer_context(scenario):
#     """
#     Infer the context of a BDD scenario using semantic embeddings.
#     """
#     # Generate embedding for the scenario
#     scenario_embedding = get_embedding(scenario)
#     return scenario_embedding

# def process_bdd(file_path):
#     with open(file_path, "r") as file:
#         bdd_scenarios = file.read().split("Scenario:")[1:]  # Split by "Scenario:"
    
#     # Process BDD scenarios
#     parsed_scenarios = []
#     for scenario in bdd_scenarios:
#         scenario_embedding = infer_context(scenario)  # Generate embedding for the entire scenario
#         parsed_scenarios.append({
#             "scenario": scenario.strip(),
#             "embedding": scenario_embedding
#         })
#     return parsed_scenarios

# def get_embedding(text):
#     inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
#     with torch.no_grad():
#         outputs = model(**inputs)
#     return outputs.last_hidden_state.mean(dim=1)  # Average pooling


from shared import tokenizer, model
import torch
from transformers import pipeline

def process_bdd(file_path):
    """
    Process a single BDD scenario from a file and generate embeddings and semantic descriptions.
    Splits the scenario into steps and processes each step individually.
    """
    # Initialize summarizer
    summarizer = None
    try:
        summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    except Exception as e:
        print(f"Failed to load summarization model: {e}")

    # Read the entire file as a single scenario
    with open(file_path, "r") as file:
        scenario = file.read().strip()

    # Split the scenario into steps
    steps = scenario.split("\n")
    processed_steps = []

    for step in steps:
        step = step.strip()
        if step:  # Skip empty lines
            # Generate embedding for the step
            step_embedding = get_embedding(step)

            # Generate semantic description for the step
            step_description = generate_semantic_description(step, summarizer) if summarizer else "No description available"

            # Add the processed step to the list
            processed_steps.append({
                "step": step,
                "embedding": step_embedding,
                "description": step_description
            })

    # Return the processed scenario with step-level data
    return {
        "scenario": scenario,
        "steps": processed_steps,
        "embedding": get_embedding(scenario),  # Embedding for the entire scenario
        "description": generate_semantic_description(scenario, summarizer) if summarizer else "No description available"  # Description for the entire scenario
    }

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
    Generate a semantic description of a BDD scenario or step using a summarization model.
    """
    if summarizer:
        input_length = len(text.split())
        max_length = min(50, input_length)
        min_length = min(25, max_length // 2)
        description = summarizer(text, max_length=max_length, min_length=min_length, do_sample=False)[0]['summary_text']
        return description
    else:
        return "No description available"