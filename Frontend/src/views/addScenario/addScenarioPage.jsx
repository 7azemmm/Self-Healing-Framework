import { Box, Button, Input, Text, Textarea, VStack, useToast, Select } from "@chakra-ui/react";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import { useState, useEffect } from "react";
import axios from "axios";

const AddScenario = () => {
  const [selectedProject, setSelectedProject] = useState("");
  const [scenario, setScenario] = useState("");
  const [urls, setUrls] = useState("");
  const [projects, setProjects] = useState([]);
  const toast = useToast();

  // Fetch projects from the backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get("/get_projects/");
        setProjects(response.data);
      } catch (error) {
        toast({
          title: "Error fetching projects",
          description: error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchProjects();
  }, []);

  const handleStartMapping = async () => {
    if (!selectedProject) {
      toast({
        title: "Project Not Selected",
        description: "Please select a project before starting the mapping.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!scenario.trim() || !urls.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both the scenario and at least one URL.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await axios.post("/scenario/", {
        project_id: selectedProject,
        bdd: scenario,
        links: urls,
      });
      toast({
        title: "Mapping Started",
        description: response.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Mapping Failed",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box display="flex" h="100vh" overflow="hidden">
      <Sidebar />
      <Box flex="1" bg="gray.50" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" px={6} py={4} overflowY="auto">
          <Box bg="white" p={6} borderRadius="md" shadow="sm" h="100%" display="flex" flexDirection="column">
            <Text fontSize="xl" fontWeight="bold" mb={4} color="blue.700">
              Add a New Scenario
            </Text>
            
            <VStack spacing={4} align="stretch" flex="1">
              <Box>
                <Text fontWeight="medium" mb={1}>Select Project:</Text>
                <Select
                  placeholder="Select project..."
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  bg="gray.100"
                >
                  {projects.map((project) => (
                    <option key={project.project_id} value={project.project_id}>
                      {project.project_name}
                    </option>
                  ))}
                </Select>
              </Box>
              
              <Box>
                <Text fontWeight="medium" mb={1}>BDD Scenario:</Text>
                <Textarea
                  placeholder="Enter your scenario here..."
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  size="md"
                  bg="gray.100"
                />
              </Box>
              
              <Box>
                <Text fontWeight="medium" mb={1}>HTML Page URLs:</Text>
                <Textarea
                  placeholder="Enter URLs (one per line)..."
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  size="md"
                  bg="gray.100"
                />
              </Box>
              
              <Button colorScheme="blue" size="lg" onClick={handleStartMapping} alignSelf="flex-start">
                Start Mapping
              </Button>
            </VStack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AddScenario;