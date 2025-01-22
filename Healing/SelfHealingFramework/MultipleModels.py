from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sentence_transformers import SentenceTransformer
from fuzzywuzzy import fuzz
import nltk
import numpy as np
from typing import Dict, List
import logging
from datetime import datetime
import json
import re
import time
import cv2
from PIL import Image
import io
from concurrent.futures import ThreadPoolExecutor
import torch
from torchvision import models

# Download required NLTK data
nltk.download('punkt', quiet=True)
nltk.download('averaged_perceptron_tagger', quiet=True)
nltk.download('wordnet', quiet=True)
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

class SelfHealingFramework:
    def __init__(self, mapping_file_path: str):
        self.driver = None
        self.logger = self._setup_logger()
        self.mappings = self._load_mappings(mapping_file_path)
        self.healing_history = {}
        self.lemmatizer = WordNetLemmatizer()
        
        # AI Models Initialization
        self.semantic_model = SentenceTransformer("all-MiniLM-L6-v2")
        self.visual_model = self._initialize_visual_model()
        
        # Caching and Storage
        self.embedding_cache = {}
        self.reference_screenshots = {}
        self.successful_healings = []
        
        # Visual Context Settings
        self.visual_context_radius = 100
        
        # Dynamic Weights
        self.weights = {
            'semantic': 0.25,
            'structural': 0.25,
            'visual': 0.25,
            'attribute': 0.25
        }

    def _setup_logger(self):
        """Enhanced logging setup"""
        logging.basicConfig(
            level=logging.DEBUG,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('healing.log'),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger(__name__)

    def _initialize_visual_model(self):
        """Initialize ResNet model for visual matching"""
        try:
            model = models.resnet18(pretrained=True)
            model.eval()
            return model
        except Exception as e:
            self.logger.warning(f"Visual model initialization failed: {e}")
            return None



    def find_element(self, bdd_step: str, timeout: int = 10):
        """Enhanced element finding with parallel healing strategies"""
        if bdd_step not in self.mappings:
            self.logger.warning(f"No mapping found for BDD step: {bdd_step}")
            return None
            
        element_info = self.mappings[bdd_step]
        
        # Try regular finding first
        element = self._find_with_original_locators(element_info, timeout)
        if element:
            self._record_successful_find(bdd_step, element_info)
            return element
            
        # If not found, initiate parallel healing
        healed_element = self._parallel_heal_element(element_info)
        if healed_element:
            self._record_successful_healing(bdd_step, element_info)
        else:
            self._record_failed_find(bdd_step, element_info)
        return healed_element

    def _find_with_original_locators(self, element_info: dict, timeout: int):
        """Try finding element with original locators"""
        for strategy, locator in element_info['locator_strategies'].items():
            try:
                element = WebDriverWait(self.driver, timeout).until(
                    EC.presence_of_element_located((getattr(By, strategy.upper()), locator))
                )
                return element
            except Exception as e:
                self.logger.debug(f"Strategy {strategy} failed: {e}")
                continue
        return None

    def _parallel_heal_element(self, element_info: dict):
        """Parallel processing for different healing strategies"""
        self.logger.info("Starting parallel healing process")
        
        # Get all page elements once to avoid multiple DOM queries
        page_elements = self._get_all_page_elements()
        
        with ThreadPoolExecutor() as executor:
            futures = {
                'semantic': executor.submit(self._semantic_matching, element_info, page_elements),
                'visual': executor.submit(self._visual_matching, element_info, page_elements),
                'structural': executor.submit(self._structural_matching, element_info, page_elements)
            }
            
        results = {key: future.result() for key, future in futures.items()}
        return self._combine_healing_results(results, element_info)

    def _combine_healing_results(self, results: dict, element_info: dict):
        """Combine results from different healing strategies"""
        combined_scores = {}
        
        for element in self._get_all_page_elements():
            element_id = id(element['element'])
            
            # Get scores from each strategy
            scores = {
                'semantic': next((score for elem, score in results['semantic'] 
                                if id(elem['element']) == element_id), 0),
                'visual': next((score for elem, score in results['visual'] 
                              if id(elem['element']) == element_id), 0),
                'structural': next((score for elem, score in results['structural'] 
                                  if id(elem['element']) == element_id), 0)
            }
            
            # Calculate attribute similarity
            attribute_score = self._calculate_attribute_similarity(
                element_info.get('attributes', {}),
                element.get('attributes', {})
            )
            scores['attribute'] = attribute_score
            
            # Calculate weighted score
            weighted_score = sum(score * self.weights[key] 
                               for key, score in scores.items())
            
            combined_scores[element_id] = (element, weighted_score)
            
            self.logger.debug(f"Element {element_id} scores: {scores}, "
                            f"Weighted total: {weighted_score}")
        
        # Find best match
        if combined_scores:
            best_match = max(combined_scores.items(), key=lambda x: x[1][1])
            if best_match[1][1] > 0.6:  # Threshold
                self._learn_from_success(element_info, best_match[1][0])
                return best_match[1][0]['element']
        
        return None

    def _record_successful_healing(self, bdd_step: str, element_info: dict):
        """Record successful healing attempt"""
        timestamp = datetime.now().isoformat()
        healing_record = {
            'timestamp': timestamp,
            'bdd_step': bdd_step,
            'original_locators': element_info['locator_strategies'].copy(),
            'healing_weights': self.weights.copy(),
            'status': 'success'
        }
        self.healing_history[f"{bdd_step}_{timestamp}"] = healing_record
        self.logger.info(f"Successfully healed element for step: {bdd_step}")

    def _get_all_page_elements(self) -> list:
        """Get all elements from current page with attributes"""
        elements = []
        try:
            for element in self.driver.find_elements(By.XPATH, "//*"):
                try:
                    elements.append({
                        'element': element,
                        'attributes': {
                            'id': element.get_attribute('id'),
                            'tag_name': element.tag_name,
                            'class_name': element.get_attribute('class'),
                            'text': element.text,
                            'type': element.get_attribute('type'),
                            'name': element.get_attribute('name'),
                            'placeholder': element.get_attribute('placeholder'),
                            'value': element.get_attribute('value')
                        }
                    })
                except Exception as e:
                    self.logger.debug(f"Failed to extract attributes: {e}")
                    continue
        except Exception as e:
            self.logger.error(f"Failed to get page elements: {e}")
        
        return elements


    def _visual_matching(self, element_info: dict, page_elements: list):
        """Enhanced visual matching with context awareness"""
        element_id = element_info['element_id']
        
        try:
            # Get or create reference screenshot
            if element_id not in self.reference_screenshots:
                self._store_initial_reference(element_info)
                
            if element_id not in self.reference_screenshots:
                self.logger.warning("No reference screenshot available for visual matching")
                return []
                
            reference_data = self.reference_screenshots[element_id]
            matches = []
            
            for element in page_elements:
                try:
                    current_visual_data = self._capture_element_context(element['element'])
                    if not current_visual_data:
                        continue
                        
                    similarity = self._calculate_visual_similarity(
                        reference_data,
                        current_visual_data
                    )
                    matches.append((element, similarity))
                    
                except Exception as e:
                    self.logger.debug(f"Visual matching failed for element: {e}")
                    continue
                    
            return sorted(matches, key=lambda x: x[1], reverse=True)
            
        except Exception as e:
            self.logger.error(f"Visual matching process failed: {e}")
            return []

    def _capture_element_context(self, element, context_radius=None):
        """Capture both element and its surrounding context"""
        try:
            if context_radius is None:
                context_radius = self.visual_context_radius
                
            # Get element location and size
            location = element.location
            size = element.size
            
            # Calculate context boundaries
            context_left = max(0, location['x'] - context_radius)
            context_top = max(0, location['y'] - context_radius)
            context_right = location['x'] + size['width'] + context_radius
            context_bottom = location['y'] + size['height'] + context_radius
            
            # Capture full page screenshot
            screenshot = self.driver.get_screenshot_as_png()
            image = Image.open(io.BytesIO(screenshot))
            
            # Crop the context area
            context_image = image.crop((
                context_left, context_top,
                context_right, context_bottom
            ))
            
            # Convert to numpy array for processing
            context_array = np.array(context_image)
            
            # Store element's relative position within context
            element_relative_pos = {
                'x': location['x'] - context_left,
                'y': location['y'] - context_top,
                'width': size['width'],
                'height': size['height']
            }
            
            return {
                'context_image': context_array,
                'element_position': element_relative_pos,
                'context_boundaries': {
                    'left': context_left,
                    'top': context_top,
                    'right': context_right,
                    'bottom': context_bottom
                }
            }
            
        except Exception as e:
            self.logger.debug(f"Failed to capture element context: {e}")
            return None

    def _store_initial_reference(self, element_info: dict):
        """Store initial visual reference during mapping creation"""
        try:
            element = self._find_with_original_locators(element_info, timeout=5)
            if element:
                visual_data = self._capture_element_context(element)
                if visual_data:
                    self.reference_screenshots[element_info['element_id']] = {
                        'visual_data': visual_data,
                        'features': self._extract_visual_features(visual_data['context_image'])
                    }
                    self.logger.info(f"Stored reference screenshot for {element_info['element_id']}")
        except Exception as e:
            self.logger.error(f"Failed to store reference screenshot: {e}")

    def _extract_visual_features(self, image):
        """Extract robust visual features using multiple techniques"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            # Initialize feature detector (ORB is faster than SIFT and patent-free)
            orb = cv2.ORB_create(
                nfeatures=1000,
                scaleFactor=1.2,
                nlevels=8,
                edgeThreshold=31,
                firstLevel=0,
                WTA_K=2,
                patchSize=31
            )
            
            # Detect keypoints and compute descriptors
            keypoints, descriptors = orb.detectAndCompute(gray, None)
            
            # Calculate color histogram
            hist = cv2.calcHist([image], [0, 1, 2], None, [8, 8, 8], 
                              [0, 256, 0, 256, 0, 256])
            hist = cv2.normalize(hist, hist).flatten()
            
            # Calculate edge features using Canny
            edges = cv2.Canny(gray, 100, 200)
            
            return {
                'descriptors': descriptors,
                'keypoints': keypoints,
                'histogram': hist,
                'edges': edges
            }
        except Exception as e:
            self.logger.debug(f"Failed to extract visual features: {e}")
            return None

    def _calculate_visual_similarity(self, ref_data, current_data):
        """Calculate visual similarity using multiple metrics"""
        try:
            ref_features = ref_data['features']
            current_features = self._extract_visual_features(current_data['context_image'])
            
            if not ref_features or not current_features:
                return 0.0
            
            # Feature matching score
            feature_score = self._calculate_feature_matching_score(
                ref_features['descriptors'],
                current_features['descriptors']
            )
            
            # Histogram similarity
            hist_score = cv2.compareHist(
                ref_features['histogram'],
                current_features['histogram'],
                cv2.HISTCMP_CORREL
            )
            
            # Edge similarity
            edge_score = self._calculate_edge_similarity(
                ref_features['edges'],
                current_features['edges']
            )
            
            # Position similarity
            position_score = self._calculate_position_similarity(
                ref_data['visual_data']['element_position'],
                current_data['element_position']
            )
            
            # Weighted combination of scores
            weights = {
                'feature': 0.3,
                'histogram': 0.2,
                'edge': 0.2,
                'position': 0.3
            }
            
            final_score = (
                feature_score * weights['feature'] +
                hist_score * weights['histogram'] +
                edge_score * weights['edge'] +
                position_score * weights['position']
            )
            
            return max(0.0, min(1.0, final_score))  # Normalize to [0,1]
            
        except Exception as e:
            self.logger.debug(f"Failed to calculate visual similarity: {e}")
            return 0.0

    def _calculate_feature_matching_score(self, ref_descriptors, current_descriptors):
        """Calculate feature matching score using ORB descriptors"""
        try:
            if ref_descriptors is None or current_descriptors is None:
                return 0.0
                
            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
            matches = bf.match(ref_descriptors, current_descriptors)
            
            # Sort matches by distance
            matches = sorted(matches, key=lambda x: x.distance)
            
            # Calculate normalized score
            max_matches = min(len(matches), 50)  # Cap at 50 matches
            if max_matches == 0:
                return 0.0
                
            good_matches = sum(1 for m in matches[:max_matches] if m.distance < 50)
            return good_matches / max_matches
            
        except Exception as e:
            self.logger.debug(f"Feature matching failed: {e}")
            return 0.0
        


    def _semantic_matching(self, element_info: dict, page_elements: list):
        """Enhanced semantic matching with caching"""
        try:
            cache_key = str(element_info['element_id'])
            
            # Get or compute reference embedding
            if cache_key not in self.embedding_cache:
                text = self._get_element_text_features(element_info)
                self.embedding_cache[cache_key] = self.semantic_model.encode(text)
                
            reference_embedding = self.embedding_cache[cache_key]
            matches = []
            
            for element in page_elements:
                try:
                    element_text = self._get_element_text_features(element)
                    current_embedding = self.semantic_model.encode(element_text)
                    similarity = float(np.dot(reference_embedding, current_embedding) / 
                                    (np.linalg.norm(reference_embedding) * np.linalg.norm(current_embedding)))
                    matches.append((element, similarity))
                except Exception as e:
                    self.logger.debug(f"Failed to compute semantic similarity: {e}")
                    continue
                    
            return sorted(matches, key=lambda x: x[1], reverse=True)
            
        except Exception as e:
            self.logger.error(f"Semantic matching failed: {e}")
            return []

    def _get_element_text_features(self, element_info: dict) -> str:
        """Extract and process text features from element"""
        features = []
        
        # Extract all relevant text attributes
        attributes = element_info.get('attributes', {})
        for attr in ['id', 'name', 'class_name', 'text', 'type', 'placeholder', 'value']:
            value = attributes.get(attr, '')
            if value:
                features.append(str(value))
                
        # Combine and preprocess text
        text = ' '.join(features).lower()
        
        # Tokenize and lemmatize
        tokens = word_tokenize(text)
        lemmatized = [self.lemmatizer.lemmatize(token) for token in tokens]
        
        return ' '.join(lemmatized)

    def _structural_matching(self, element_info: dict, page_elements: list):
        """Enhanced structural matching with detailed comparison"""
        try:
            original_struct = self._get_structural_features(element_info)
            matches = []
            
            for element in page_elements:
                try:
                    current_struct = self._get_structural_features(element)
                    similarity = self._calculate_structural_similarity(
                        original_struct, current_struct)
                    matches.append((element, similarity))
                except Exception as e:
                    self.logger.debug(f"Failed to compute structural similarity: {e}")
                    continue
                    
            return sorted(matches, key=lambda x: x[1], reverse=True)
            
        except Exception as e:
            self.logger.error(f"Structural matching failed: {e}")
            return []

    def _learn_from_success(self, element_info: dict, matched_element: dict):
        """Learn from successful healings to improve future matching"""
        try:
            healing_data = {
                'timestamp': datetime.now().isoformat(),
                'original_info': element_info,
                'matched_info': matched_element,
                'weights': self.weights.copy(),
                'success_metrics': {
                    'semantic_score': self._calculate_semantic_success(),
                    'visual_score': self._calculate_visual_success(),
                    'structural_score': self._calculate_structural_success()
                }
            }
            
            self.successful_healings.append(healing_data)
            
            # Adjust weights if we have enough data
            if len(self.successful_healings) >= 5:
                self._adjust_weights()
                
            # Update locator strategies
            self._update_locator_strategies(element_info, matched_element)
            
        except Exception as e:
            self.logger.error(f"Failed to learn from success: {e}")

    def _adjust_weights(self):
        """Dynamically adjust strategy weights based on success patterns"""
        try:
            recent_healings = self.successful_healings[-5:]
            success_rates = {
                'semantic': 0,
                'visual': 0,
                'structural': 0,
                'attribute': 0
            }
            
            for healing in recent_healings:
                metrics = healing['success_metrics']
                success_rates['semantic'] += metrics['semantic_score']
                success_rates['visual'] += metrics['visual_score']
                success_rates['structural'] += metrics['structural_score']
                
            # Normalize weights
            total = sum(success_rates.values())
            if total > 0:
                self.weights = {k: v/total for k, v in success_rates.items()}
                self.logger.info(f"Adjusted weights: {self.weights}")
                
        except Exception as e:
            self.logger.error(f"Failed to adjust weights: {e}")

    def save_healing_report(self, filename="enhanced_healing_report.json"):
        """Generate and save detailed healing report"""
        try:
            report = {
                "summary": {
                    "total_healings": len(self.healing_history),
                    "successful_healings": len(self.successful_healings),
                    "current_weights": self.weights,
                    "timestamp": datetime.now().isoformat()
                },
                "healing_history": self.healing_history,
                "successful_patterns": [
                    {
                        "timestamp": healing["timestamp"],
                        "success_metrics": healing["success_metrics"],
                        "weights_used": healing["weights"]
                    }
                    for healing in self.successful_healings
                ]
            }
            
            with open(filename, "w") as f:
                json.dump(report, f, indent=2)
                self.logger.info(f"Enhanced healing report saved to {filename}")
                
        except Exception as e:
            self.logger.error(f"Failed to save healing report: {e}")

    def clear_caches(self):
        """Clear all caches and temporary storage"""
        try:
            self.embedding_cache.clear()
            self.reference_screenshots.clear()
            self.successful_healings.clear()
            self.logger.info("All caches cleared successfully")
        except Exception as e:
            self.logger.error(f"Failed to clear caches: {e}")

    def close(self):
        """Cleanup resources and close browser"""
        try:
            self.clear_caches()
            if self.driver:
                self.driver.quit()
            self.logger.info("Framework closed successfully")
        except Exception as e:
            self.logger.error(f"Failed to close framework: {e}")

def main():
    """Example usage of the enhanced framework"""
    framework = None
    try:
        # Initialize framework with mapping file
        framework = SelfHealingFramework('./bdd_element_mapping.json')
        
        # Start browser
        framework.start_browser()
        
        # Navigate to application
        framework.driver.get("http://127.0.0.1:5500/htmlexamples/htmlexamples/index.html")
        
        # Execute test steps
        framework.execute_all_steps(delay=2.0)
        
        # Save detailed report
        framework.save_healing_report("./enhanced_healing_report.json")
        
    except Exception as e:
        logging.error(f"Main execution failed: {e}")
    finally:
        # Safely close framework if it was initialized
        if framework is not None:
            framework.close()

if __name__ == "__main__":
    main()