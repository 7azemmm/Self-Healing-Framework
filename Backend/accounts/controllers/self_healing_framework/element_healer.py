from sentence_transformers import SentenceTransformer, util
from symspellpy import SymSpell
from typing import Dict, List, Optional, Any
import logging
import os

class ElementHealer:
    """Handles element healing using ML and other strategies."""
    def __init__(self):
        try:
            # Check if fine-tuned model exists
            model_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
            fine_tuned_model_path = os.path.join(model_dir, 'fine_tuned_model')
            
            if os.path.exists(fine_tuned_model_path):
                self.similarity_model = SentenceTransformer(fine_tuned_model_path)
                self.logger = logging.getLogger(__name__)
                self.logger.info("Using fine-tuned model for element healing")
            else:
                self.similarity_model = SentenceTransformer('all-MiniLM-L6-v2')  # Default model
                self.logger = logging.getLogger(__name__)
                self.logger.info("Using default model for element healing")
                
            self.sym_spell = SymSpell()
        except Exception as e:
            self.logger = logging.getLogger(__name__)
            self.logger.error(f"Failed to initialize ElementHealer: {str(e)}")
            # Fallback to default model
            self.similarity_model = SentenceTransformer('all-MiniLM-L6-v2')

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
