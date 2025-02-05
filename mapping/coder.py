import re
from transformers import pipeline
import logging

def extract_urls(java_code):
    """Extracts URLs from Java code."""
    url_pattern = re.compile(r'https?://\S+')
    return url_pattern.findall(java_code)

def extract_locators_with_context(java_code):
    """Extracts locators with surrounding code context from Java Selenium POM code."""
    # Updated pattern to match @FindBy annotations
    locator_pattern = re.compile(r'@FindBy\((id|name|xpath|css)\s*=\s*"(.*?)"\)\s*(?://\s*(.*))?')
    
    locators = {}
    lines = java_code.split('\n')
    
    for i, line in enumerate(lines):
        locator_match = locator_pattern.search(line)
        if locator_match:
            locator_type, locator_value, comment = locator_match.groups()
            
            # Look at next line to get the variable name (WebElement declaration)
            variable_name = ""
            if i + 1 < len(lines):
                next_line = lines[i + 1]
                variable_match = re.search(r'private\s+WebElement\s+(\w+)\s*;', next_line)
                if variable_match:
                    variable_name = variable_match.group(1)
            
            # Get surrounding context (5 lines before and after)
            start_idx = max(0, i - 5)
            end_idx = min(len(lines), i + 6)
            context = '\n'.join(lines[start_idx:end_idx])
            
            locators[locator_value] = {
                'type': locator_type,
                'variable_name': variable_name,
                'comment': comment.strip() if comment else "",
                'context': context
            }
    
    return locators

def get_ai_description(code_context, locator_info):
    """Uses AI to generate a description of the locator based on code context."""
    try:
        # Initialize the code understanding model
        code_model = pipeline(
            "text2text-generation",  # Changed to text2text-generation
            model="Salesforce/codet5-base",  # Using CodeT5 which is better for code understanding
            device=-1  # Use CPU. Use 0 for GPU if available
        )
        
        # Prepare prompt for the model
        prompt = f"""
        Analyze this Java Selenium Page Object Model code:
        {code_context}
        
        Describe the purpose and functionality of this web element:
        - Element type: {locator_info['type']}
        - Element locator: {locator_info['value']}
        - Variable name: {locator_info['variable_name']}
        
        Explain in one sentence what this element represents and its purpose on the webpage:
        """
        
        # Generate description
        response = code_model(prompt, max_length=100, num_return_sequences=1)[0]['generated_text']
        
        return response.strip()
    except Exception as e:
        logging.error(f"Error generating AI description: {str(e)}")
        return "Could not generate AI description"

def analyze_java_file(file_path):
    """Reads a Java file, extracts locators and generates AI descriptions."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            java_code = file.read()
        
        urls = extract_urls(java_code)
        locators = extract_locators_with_context(java_code)
        
        # Add AI-generated descriptions for each locator
        for locator_value, details in locators.items():
            details['ai_description'] = get_ai_description(
                details['context'],
                {
                    'type': details['type'],
                    'value': locator_value,
                    'variable_name': details['variable_name']
                }
            )
        
        return locators, urls
    except Exception as e:
        logging.error(f"Error analyzing Java file: {str(e)}")
        return {}, []

# Example usage
if __name__ == "__main__":
    java_file_path = "./pom_files/LoginPage.java"
    locators, urls = analyze_java_file(java_file_path)
    
    print("\nExtracted Locators with AI Descriptions:")
    for locator, details in locators.items():
        print(f"\nLocator: {locator}")
        print(f"Type: {details['type']}")
        print(f"Variable Name: {details['variable_name']}")
        print(f"Original Comment: {details['comment']}")
        print(f"AI Description: {details['ai_description']}")
    
    print("\nExtracted URLs:")
    for url in urls:
        print(url)
