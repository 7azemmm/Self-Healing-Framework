import re
from ..element_locators import ElementLocators
from .base_reader import IFileReader

class POMReader(IFileReader):
    """Reads and parses Page Object Model files"""
    def read(self, content):
        """Extract locators and page URL from POM file"""
        locators_dict = {}
        page_url = None
        
        # Find all @FindBy annotations
        findby_matches = re.findall(r'@FindBy\((.*?)\)\s+WebElement\s+(\w+);', content)
        
        for match in findby_matches:
            element_name = match[1]
            locators = ElementLocators()
            locator_attrs = re.findall(r'(\w+)\s*=\s*"([^"]+)"', match[0])
            
            for attr, value in locator_attrs:
                attr_lower = attr.lower()
                if attr_lower == 'id':
                    locators.id = value
                elif attr_lower == 'classname':
                    locators.class_name = value
                elif attr_lower == 'xpath':
                    locators.xpath = value
                elif attr_lower == 'name':
                    locators.name = value
                elif attr_lower == 'type':
                    locators.type = value
                    
            locators.original_locator = match[0]
            locators_dict[element_name] = locators
            
        # Extract page URL
        url_match = re.search(r'driver\.get\("(.*?)"\)', content)
        if url_match:
            page_url = url_match.group(1)
            
        return locators_dict, page_url