from typing import Dict, Any, List
import logging

class MappingLoader:
    """Handles loading and processing BDD step mappings."""
    def __init__(self, mapping: List[Dict]):
        self.mapping = mapping
        self.logger = logging.getLogger(__name__)

    def load_mappings(self) -> Dict:
        """Load BDD step to element ID mappings."""
        mappings = {}
        for row in self.mapping:
            try:
                bdd_step = row.get('Step', '').strip()
                if not bdd_step:
                    continue

                element_id = str(row.get('ID', '')).strip()
                css = row.get('CSS Selector', '').strip()
                xpath = row.get('XPath (Absolute)', '').strip()
                full_xpath = row.get('XPath (Absolute)', '').strip()
                link = row.get('Page', '').strip()

                mappings[bdd_step] = {
                    'ID': element_id,
                    'CSS Selector': css,
                    'XPath (Absolute)': xpath,
                    'XPath (Absolute)': full_xpath,
                    'Page': link,
                    'locator_strategies': self._generate_locator_strategies(element_id, css, xpath, full_xpath)
                }
            except Exception as e:
                self.logger.warning(f"Error processing mapping row: {str(e)}")
                continue
        return mappings

    def _generate_locator_strategies(self, element_id: str, css: str, xpath: str, full_xpath: str) -> Dict:
        """Generate multiple locator strategies for an element."""
        strategies = {}
        
        if element_id:
            strategies['id'] = element_id
            if not css:
                strategies['CSS Selector'] = f"#{element_id}"
        
        if css:
            strategies['CSS Selector'] = css
            
        if xpath:
            strategies['XPath (Absolute)'] = xpath
            
        if full_xpath:
            strategies['XPath (Absolute)'] = full_xpath
            
        return strategies