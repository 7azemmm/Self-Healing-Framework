


# from bdd_processor import process_bdd
# from html_processor import process_html
# from mapping import map_bdd_to_html

# def main():
#     # Process BDD scenarios
#     bdd_scenarios = process_bdd("data/bdd_scenarios.txt")

#     # Process HTML pages
#     html_pages = process_html("data/html_pages")

#     # Perform mapping
#     mappings = map_bdd_to_html(bdd_scenarios, html_pages)

#     # Print results
#     for mapping in mappings:
#         print(f"BDD Scenario: {mapping['scenario']}")
#         for page, element in mapping["matches"]:
#             print(f"  Page: {page}, Element: {element['label']}")
#         print()

# if __name__ == "__main__":
#     main()


# from bdd_processor import process_bdd
# from html_processor import process_html
# from mapping import map_bdd_to_html

# def main():
#     # Process BDD scenarios
#     bdd_scenarios = process_bdd("data/bdd_scenarios.txt")

#     # Process HTML pages
#     html_pages = process_html("data/html_pages")

#     # Perform mapping
#     mappings = map_bdd_to_html(bdd_scenarios, html_pages)

#     # Print results
#     for mapping in mappings:
#         print(f"BDD Scenario: {mapping['scenario']}")
#         for match in mapping["matches"]:
#             print(f"  Page: {match['page']}, Step: {match['step']}, Element: {match['element']['label']}")
#         print()

# if __name__ == "__main__":
#     main()

# from bdd_processor import process_bdd
# from html_processor import process_html
# from mapping import map_bdd_to_html

# def main():
#     # Process BDD scenarios
#     bdd_scenarios = process_bdd("data/bdd_scenarios.txt")

#     # Process HTML pages
#     html_pages = process_html("data/html_pages")

#     # Perform mapping
#     mappings = map_bdd_to_html(bdd_scenarios, html_pages)

#     # Print results
#     for mapping in mappings:
#         print(f"BDD Scenario: {mapping['scenario']}")
#         for match in mapping["matches"]:
#             print(f"  Page: {match['page']}, Step: {match['step']}, Element: {match['element']['attributes']['id']}")
#         print()

# if __name__ == "__main__":
#     main()


import os
import csv
from bdd_processor import process_bdd
from html_processor import process_html
from mapping import map_bdd_to_html

def get_attribute_simple(attributes, key):
    """
    Helper function to get an attribute value as a simple string.
    If the attribute is a list, it joins the list into a string.
    If the attribute is missing, it returns 'N/A'.
    """
    value = attributes.get(key)
    if value is None:
        return "N/A"
    if isinstance(value, list):
        return ", ".join(value) if value else "N/A"
    return str(value)

def main():
    print("Starting the script...")
    bdd_file = "data/bdd_scenarios.txt"
    html_dir = "data/html_pages"

    # Check if the BDD file exists
    if not os.path.exists(bdd_file):
        print(f"Error: BDD file not found at {bdd_file}")
        return

    # Check if the HTML directory exists
    if not os.path.exists(html_dir):
        print(f"Error: HTML directory not found at {html_dir}")
        return

    print("Processing BDD scenario...")
    bdd_scenario = process_bdd(bdd_file)
    print("BDD scenario processed.")

    print("Processing HTML pages...")
    html_pages = process_html(html_dir)
    print("HTML pages processed.")

    print("Performing mapping...")
    mappings = map_bdd_to_html(bdd_scenario, html_pages)
    print("Mapping completed.")

    print("Writing results to CSV...")
    csv_file_path = "mapping_results.csv"
    with open(csv_file_path, mode="w", newline="", encoding="utf-8") as csv_file:
        # Define the CSV writer
        csv_writer = csv.writer(csv_file)

        # Write the header row
        csv_writer.writerow([
            "Step", "Page", "ID", "Class", "Name", "Value",
            "XPath (Absolute)", "XPath (Relative)", "CSS Selector"
        ])

        # Write each mapping to the CSV file
        for match in mappings:
            csv_writer.writerow([
                match["step"],  # Step
                match["page"],  # Page
                get_attribute_simple(match["element"]["attributes"], "id"),  # ID
                get_attribute_simple(match["element"]["attributes"], "class"),  # Class
                get_attribute_simple(match["element"]["attributes"], "name"),  # Name
                get_attribute_simple(match["element"]["attributes"], "value"),  # Value
                get_attribute_simple(match["element"]["attributes"], "xpath_absolute"),  # XPath (Absolute)
                get_attribute_simple(match["element"]["attributes"], "xpath_relative"),  # XPath (Relative)
                get_attribute_simple(match["element"]["attributes"], "css_selector"),  # CSS Selector
            ])

    print(f"Mapping results have been saved to {csv_file_path}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"An error occurred: {e}")