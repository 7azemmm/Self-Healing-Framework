from sentence_transformers import SentenceTransformer, util
from symspellpy import SymSpell
from typing import Dict, List, Optional, Any
import logging

class ElementHealer:
    """Handles element healing using ML and other strategies."""
    def __init__(self):
        try:
            self.similarity_model = SentenceTransformer('all-MiniLM-L6-v2')  # Default model
            self.sym_spell = SymSpell()
            self.logger = logging.getLogger(__name__)
        except Exception as e:
            raise RuntimeError(f"Failed to initialize ElementHealer: {str(e)}")

    def heal_element(self, original_attributes: Dict, page_elements: List[Dict]) -> Optional[Dict]:
        """Attempt to heal a broken element locator."""
        try:
            return self._find_best_match(original_attributes, page_elements)
        except Exception as e:
            self.logger.error(f"Error during element healing: {str(e)}")
            return None

    def _find_best_match(self, original_attributes: Dict, page_elements: List[Dict]) -> Optional[Dict]:
        """Find the most similar element on the page using ML."""
        best_match = None
        best_score = 0.0
        threshold = 0.3

        original_text = self._attributes_to_text(original_attributes)
        if not original_text.strip():
            return None

        try:
            original_embedding = self.similarity_model.encode(original_text, convert_to_tensor=True)

            for element_data in page_elements:
                current_text = self._attributes_to_text(element_data['attributes'])
                if not current_text.strip():
                    continue

                current_embedding = self.similarity_model.encode(current_text, convert_to_tensor=True)
                similarity = util.pytorch_cos_sim(original_embedding, current_embedding).item()

                if similarity > best_score and similarity > threshold:
                    best_score = similarity
                    best_match = element_data

            return best_match
        except Exception as e:
            self.logger.error(f"Error in similarity comparison: {str(e)}")
            return None

    def _attributes_to_text(self, attributes: Dict) -> str:
        """Convert attributes dictionary to text for similarity comparison."""
        return ' '.join(str(value) for value in attributes.values() if value)