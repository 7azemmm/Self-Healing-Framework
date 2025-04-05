from sentence_transformers import SentenceTransformer, util
import torch

class BDDToLocatorMapper:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)

    def match(self, bdd_steps, locators_dict):
        pom_texts = list(locators_dict.keys())
        pom_embeddings = self.model.encode(pom_texts, convert_to_tensor=True)
        step_batch = [step for _, step in bdd_steps]
        step_embeddings = self.model.encode(step_batch, convert_to_tensor=True)

        mapping = []
        for idx, (scenario, step) in enumerate(bdd_steps):
            step_embedding = step_embeddings[idx]
            similarities = util.pytorch_cos_sim(step_embedding, pom_embeddings)[0]
            best_match_idx = torch.argmax(similarities).item()
            best_match = pom_texts[best_match_idx]
            matched_locators = locators_dict.get(best_match)
            mapping.append([scenario, step, matched_locators])

        return mapping