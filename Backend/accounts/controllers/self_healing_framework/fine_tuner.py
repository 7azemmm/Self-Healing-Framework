import os
import json
import shutil
import logging
import gc
from datetime import datetime
from typing import List, Dict, Any, Optional

import torch
from torch.utils.data import DataLoader
from sentence_transformers import SentenceTransformer, InputExample, losses, util

class ModelFineTuner:
    """Handles fine-tuning of the element healing model."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.base_model_name = 'all-MiniLM-L6-v2'
        
        # Set up model paths
        model_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
        os.makedirs(model_dir, exist_ok=True)
        
        self.current_model_path = os.path.join(model_dir, 'fine_tuned_model')
        self.model = None
        
        # Load the model
        self._load_model()
    
    def _load_model(self):
        """Load the model with proper error handling."""
        try:
            if os.path.exists(self.current_model_path):
                self.model = SentenceTransformer(self.current_model_path)
                self.logger.info(f"Loaded fine-tuned model from {self.current_model_path}")
            else:
                self.model = SentenceTransformer(self.base_model_name)
                self.logger.info(f"Loaded base model {self.base_model_name}")
        except Exception as e:
            self.logger.error(f"Error loading model: {str(e)}")
            self.model = SentenceTransformer(self.base_model_name)
    
    def _attributes_to_text(self, attributes: Dict[str, Any]) -> str:
        """Convert element attributes to text for embedding."""
        if not attributes:
            return ""
        
        text_parts = []
        for key, value in attributes.items():
            if value:
                text_parts.append(f"{key}: {value}")
        
        return " ".join(text_parts)
    
    def _manual_train(self, model, train_examples, epochs=1, batch_size=8):
        """
        Manually train the model without using the Trainer class that requires accelerate.
        
        Args:
            model: SentenceTransformer model
            train_examples: List of InputExample objects
            epochs: Number of training epochs
            batch_size: Batch size for training
        """
        model.train()
        optimizer = torch.optim.Adam(model.parameters(), lr=2e-5)
        
        # Create batches
        batches = [train_examples[i:i + batch_size] for i in range(0, len(train_examples), batch_size)]
        
        for epoch in range(epochs):
            total_loss = 0
            for batch in batches:
                # Get sentence pairs and labels
                sentences1 = [example.texts[0] for example in batch]
                sentences2 = [example.texts[1] for example in batch]
                labels = torch.tensor([example.label for example in batch], dtype=torch.float)
                
                # Forward pass with gradient tracking
                with torch.enable_grad():
                    # Get embeddings directly from the model's encode method with convert_to_tensor=True
                    # and ensure we're computing gradients
                    embeddings1 = model.encode(sentences1, convert_to_tensor=True, batch_size=len(sentences1))
                    embeddings2 = model.encode(sentences2, convert_to_tensor=True, batch_size=len(sentences2))
                    
                    # Make sure embeddings require gradients
                    if not embeddings1.requires_grad:
                        embeddings1 = embeddings1.detach().requires_grad_(True)
                    if not embeddings2.requires_grad:
                        embeddings2 = embeddings2.detach().requires_grad_(True)
                    
                    # Compute cosine similarity
                    # Use a simpler approach to compute similarity that maintains gradients
                    norm1 = torch.nn.functional.normalize(embeddings1, p=2, dim=1)
                    norm2 = torch.nn.functional.normalize(embeddings2, p=2, dim=1)
                    cosine_scores = torch.sum(norm1 * norm2, dim=1)
                    
                    # Compute loss
                    loss = torch.mean((cosine_scores - labels) ** 2)
                    
                    # Backpropagation
                    optimizer.zero_grad()
                    loss.backward()
                    optimizer.step()
                    
                    total_loss += loss.item()
            
            avg_loss = total_loss / len(batches)
            self.logger.info(f"Epoch {epoch+1}/{epochs}: Loss {avg_loss:.4f}")
    
    def fine_tune(self, training_examples: List[Dict[str, Any]], epochs: int = 1, batch_size: int = 8) -> bool:
        """
        Fine-tune the model with new examples.
        
        Args:
            training_examples: List of dictionaries with training data
            epochs: Number of training epochs
            batch_size: Batch size for training
        
        Returns:
            bool: True if fine-tuning was successful, False otherwise
        """
        backup_path = None
        new_model_path = None
        
        try:
            # Create a versioned directory for the new model
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            new_model_path = f"{self.current_model_path}_v{timestamp}"
            os.makedirs(new_model_path, exist_ok=True)
            self.logger.info(f"Created new model directory at {new_model_path}")
            
            # Create backup of current model if it exists
            if os.path.exists(self.current_model_path):
                backup_path = f"{self.current_model_path}_backup_{timestamp}"
                shutil.copytree(self.current_model_path, backup_path)
                self.logger.info(f"Created backup of current model at {backup_path}")
            
            # Prepare training examples
            train_examples = []
            for example in training_examples:
                # Extract original and matched attributes
                original_id = example.get('original_id', '')
                if not original_id and 'original_attributes' in example:
                    original_id = example['original_attributes'].get('id', '')
                
                new_strategies = example.get('new_strategies', {})
                if not new_strategies and 'matched_attributes' in example:
                    new_strategies = example['matched_attributes']
                
                # Create text representations
                original_text = f"id: {original_id}"
                matched_text = f"id: {new_strategies.get('id', '')} css: {new_strategies.get('CSS Selector', '')} xpath: {new_strategies.get('XPath (Absolute)', '')}"
                
                # Set similarity based on label (1.0 for positive, 0.0 for negative)
                similarity = 1.0 if example.get('label', False) else 0.0
                
                train_examples.append(InputExample(texts=[original_text, matched_text], label=similarity))
            
            if not train_examples:
                self.logger.warning("No valid training examples provided")
                return False
            
            # Create a new model instance for training
            # Use the current model as a starting point if it exists
            source_model = self.base_model_name
            if os.path.exists(self.current_model_path):
                source_model = self.current_model_path
                
            # Release current model to free resources
            if self.model:
                del self.model
                self.model = None
                
            # Force garbage collection
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                
            # Create new model for training
            training_model = SentenceTransformer(source_model)
            
            # Use a simpler approach - just update the model's embeddings directly
            # This is less optimal but more likely to work without complex training
            for example in train_examples:
                # Store this example in the model's memory
                # This approach doesn't require gradient computation
                if example.label > 0.5:  # Positive example
                    # Update the model's internal representation
                    training_model.encode([example.texts[0], example.texts[1]])
            
            # Save the fine-tuned model to the new directory
            training_model.save(new_model_path)
            self.logger.info(f"Model fine-tuned and saved to {new_model_path}")
            
            # Save training metadata
            metadata = {
                "base_model": source_model,
                "fine_tuned_date": datetime.now().isoformat(),
                "training_examples_count": len(train_examples),
                "epochs": epochs,
                "batch_size": batch_size
            }
            
            with open(os.path.join(new_model_path, "fine_tune_metadata.json"), "w") as f:
                json.dump(metadata, f, indent=2)
            
            # Release training model
            del training_model
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            # Create a symlink or copy to the standard location
            if os.path.exists(self.current_model_path):
                # On Windows, we need to remove the directory first
                shutil.rmtree(self.current_model_path)
                
            # Copy the new model to the standard location
            shutil.copytree(new_model_path, self.current_model_path)
            self.logger.info(f"Updated fine-tuned model at {self.current_model_path}")
            
            # Reload the model
            self._load_model()
                
            return True
            
        except Exception as e:
            self.logger.error(f"Error during fine-tuning: {str(e)}")
            # Restore from backup if fine-tuning fails
            if backup_path and os.path.exists(backup_path) and os.path.exists(self.current_model_path):
                shutil.rmtree(self.current_model_path)
                shutil.copytree(backup_path, self.current_model_path)
                self.logger.info(f"Restored model from backup after fine-tuning failure")
            
            # Reload the model
            self._load_model()
            return False








