from .shared import tokenizer, model
import torch
from transformers import pipeline

def process_bdd(scenario):
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