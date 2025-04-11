from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import logging
from .element_locators import ElementLocators

class WebScraper:
    """Handles web page scraping to enhance locators"""
    def __init__(self, headless=True):
        self.driver = self._init_driver(headless)
        self.logger = logging.getLogger(__name__)

    def _init_driver(self, headless):
        """Initialize Chrome WebDriver"""
        chrome_options = Options()
        if headless:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        return webdriver.Chrome(options=chrome_options)

    def scrape_locators(self, url, existing_locators):
        """Enhance existing locators with additional attributes from live page"""
        try:
            self.logger.info(f"Scraping page: {url}")
            self.driver.get(url)
            
            for element_name, locators in existing_locators.items():
                primary_locator = self._get_primary_locator(locators)
                if primary_locator:
                    self._update_locators(primary_locator, locators)
                    
            return existing_locators
        except Exception as e:
            self.logger.error(f"Error scraping webpage {url}: {e}")
            return existing_locators
        finally:
            self.driver.quit()

    def _get_primary_locator(self, locators):
        """Determine the best locator strategy to use"""
        if locators.id:
            return (By.ID, locators.id)
        elif locators.name:
            return (By.NAME, locators.name)
        elif locators.class_name:
            return (By.CLASS_NAME, locators.class_name)
        elif locators.xpath:
            return (By.XPATH, locators.xpath)
        return None

    def _update_locators(self, primary_locator, locators):
        """Find element and update missing locators"""
        try:
            by, value = primary_locator
            element = self.driver.find_element(by, value)
            
            if not locators.xpath:
                locators.xpath = self.get_xpath(element)
            if not locators.name:
                locators.name = element.get_attribute("name")
            if not locators.class_name:
                locators.class_name = element.get_attribute("class")
            if not locators.type:
                locators.type = element.get_attribute("type")
                
        except Exception as e:
            self.logger.warning(f"Could not update locators: {e}")

    def get_xpath(self, element):
        """Generate absolute XPath for an element"""
        return self.driver.execute_script("""
            function getXPath(element) {
                if (element.id !== '') return '//*[@id=\"' + element.id + '\"]';
                if (element === document.body) return '/html/body';
                
                let ix = 0;
                let siblings = element.parentNode.childNodes;
                
                for (let i = 0; i < siblings.length; i++) {
                    let sibling = siblings[i];
                    if (sibling === element) 
                        return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + (ix > 0 ? '[' + (ix+1) + ']' : '');
                    if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
                        ix++;
                }
            }
            return getXPath(arguments[0]);
        """, element)