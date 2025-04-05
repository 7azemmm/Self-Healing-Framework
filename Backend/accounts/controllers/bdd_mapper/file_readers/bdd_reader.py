from .base_reader import IFileReader

class BDDReader(IFileReader):
    """Reads and parses BDD feature files"""
    def read(self, content):
        """Extract scenarios and steps from BDD content"""
        scenarios = []
        current_scenario = "Unknown Scenario"
        
        for line in content.split("\n"):
            line = line.strip()
            if line.lower().startswith("scenario:"):
                current_scenario = line.replace("Scenario:", "").strip()
            elif line.startswith(("When", "Then", "And", "But")):
                scenarios.append((current_scenario, line))
        return scenarios