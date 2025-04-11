import logging
from .file_readers import BDDReader, POMReader
from .web_scraper import WebScraper
from .mapper import BDDToLocatorMapper

class MappingProcessor:
    def __init__(self):
        self.bdd_reader = BDDReader()
        self.pom_reader = POMReader()
        self.web_scraper = WebScraper()
        self.mapper = BDDToLocatorMapper()

    def format_locators(self, locators):
        if not isinstance(locators, ElementLocators):
            return "Not Found"
        
        parts = []
        if locators.id:
            parts.append(f"id={locators.id}")
        if locators.class_name:
            parts.append(f"class={locators.class_name}")
        if locators.type:
            parts.append(f"type={locators.type}")
        if locators.xpath:
            parts.append(f"xpath={locators.xpath}")
        if locators.name:
            parts.append(f"name={locators.name}")
        
        return ", ".join(parts) if parts else "No locators found"

    def process_all_features(self,bdd,test_script):
        outputs = []
        try:
            for feature_file in bdd:
                feature_name = feature_file[0].replace(".feature", "")
                pom_file = f"{feature_name}Page.java"
                print(pom_file)

                if pom_file in test_script:
                    bdd_steps = self.bdd_reader.read(feature_file[1])
                    locators_dict, page_url = self.pom_reader.read(test_script[pom_file])

                    if page_url:
                        locators_dict = self.web_scraper.scrape_locators(page_url, locators_dict)

                    mapping = self.mapper.match(bdd_steps, locators_dict)
                    rows = [["Step", "Page", "ID", "Class", "Name", "Value",
                            "XPath (Absolute)", "XPath (Relative)", "CSS Selector"]]
                    
                    for scenario, step, locators in mapping:
                        page = page_url
                        locator_id = locators.id if locators.id else "N/A"
                        locator_class = locators.class_name if locators.class_name else "N/A"
                        locator_name = locators.name if locators.name else "N/A"
                        locator_value = "N/A"  # Placeholder as per provided example
                        xpath_absolute = locators.xpath if locators.xpath else "N/A"
                        xpath_relative = f'./{xpath_absolute}' if xpath_absolute != "N/A" else "N/A"
                        css_selector = f'#{locator_id}' if locator_id != "N/A" else "N/A"
                        rows.append([
                            step, page, locator_id, locator_class,
                            locator_name, locator_value, xpath_absolute, xpath_relative, css_selector
                        ])
                    outputs.append(rows)
                else:
                    logging.warning(f"No POM file found for {feature_file}, skipping.")
        except Exception as e:
            logging.error(f"Error processing features: {e}")
        return outputs
            
    def process(self,feature,pom):
        output = ""
        bdd_steps = self.bdd_reader.read(feature)
        locators_dict, page_url = self.pom_reader.read(pom)
        if page_url:
            locators_dict = self.web_scraper.scrape_locators(page_url, locators_dict)

        output+= f"Page URL: {page_url}\n\n"
        output+= f"Feature: \n\n"

        mapping = self.mapper.match(bdd_steps, locators_dict)

        rows = [["Step", "Page", "ID", "Class", "Name", "Value",
                "XPath (Absolute)", "XPath (Relative)", "CSS Selector"]]
        
        for scenario, step, locators in mapping:
            page = page_url
                        
            locator_id = locators.id if locators.id else "N/A"
            locator_class = locators.class_name if locators.class_name else "N/A"
            locator_name = locators.name if locators.name else "N/A"
            locator_value = "N/A"  # Placeholder as per provided example
            xpath_absolute = locators.xpath if locators.xpath else "N/A"
            xpath_relative = f'./{xpath_absolute}' if xpath_absolute != "N/A" else "N/A"
            css_selector = f'#{locator_id}' if locator_id != "N/A" else "N/A"
            rows.append([
                step, page, locator_id, locator_class,
                locator_name, locator_value, xpath_absolute, xpath_relative, css_selector
            ])

        return rows

