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
    <>
      {/* Inline CSS for Advanced Styling and Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes pulseGlow {
            0% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.3); }
            50% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.6); }
            100% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.3); }
          }

          .fade-in {
            animation: fadeIn 0.7s ease-out;
          }

          .glass-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s ease;
          }

          .glass-card:hover {
            transform: translateY(-5px);
          }

          .select-glow, .textarea-glow {
            transition: all 0.3s ease;
          }

          .select-glow:focus, .textarea-glow:focus {
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
            transform: scale(1.02);
          }

          .gradient-text {
            background: linear-gradient(90deg, #ffffff, #e0e0e0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .button-glow {
            transition: all 0.3s ease;
          }

          .button-glow:hover {
            box-shadow: 0 0 15px rgba(49, 130, 206, 0.5);
            transform: scale(1.05);
          }
        `}
      </style>

      <Box display="flex" h="100vh" overflow="hidden">
        <Sidebar />
        <Box
          ml={{ base: "60px", md: "20%" }} // Matches Sidebar width
          flex="1"
          bgGradient="linear(to-br, blue.900, teal.700)" // Consistent with Dashboard
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          <Navbar />
          <Box flex="1" px={6} py={4} overflowY="auto">
            <Box
              className="glass-card fade-in"
              p={6}
              borderRadius="lg"
              h="100%"
              display="flex"
              flexDirection="column"
            >
              <Text
                fontSize="2xl"
                fontWeight="bold"
                mb={6}
                color="white"
                fontFamily="Poppins, sans-serif"
                className="gradient-text"
              >
                Add a New Scenario
              </Text>

              <VStack spacing={6} align="stretch" flex="1">
                <Box>
                  <Text
                    fontWeight="medium"
                    mb={1}
                    color="white"
                    fontFamily="Poppins, sans-serif"
                  >
                    Select Project:
                  </Text>
                  <Select
                    placeholder="Select project..."
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="select-glow"
                    bg="rgba(255, 255, 255, 0.9)"
                    color="black"
                    border="1px solid rgba(255, 255, 255, 0.3)"
                    borderRadius="md"
                    _focus={{ borderColor: 'white' }}
                  >
                    {projects.map((project) => (
                      <option key={project.project_id} value={project.project_id}>
                        {project.project_name}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box>
                  <Text
                    fontWeight="medium"
                    mb={1}
                    color="white"
                    fontFamily="Poppins, sans-serif"
                  >
                    BDD Scenario:
                  </Text>
                  <Textarea
                    placeholder="Enter your scenario here..."
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    size="md"
                    className="textarea-glow"
                    bg="rgba(255, 255, 255, 0.9)"
                    color="black"
                    border="1px solid rgba(255, 255, 255, 0.3)"
                    borderRadius="md"
                    _focus={{ borderColor: 'white' }}
                    minH="150px"
                  />
                </Box>

                <Box>
                  <Text
                    fontWeight="medium"
                    mb={1}
                    color="white"
                    fontFamily="Poppins, sans-serif"
                  >
                    HTML Page URLs:
                  </Text>
                  <Textarea
                    placeholder="Enter URLs (one per line)..."
                    value={urls}
                    onChange={(e) => setUrls(e.target.value)}
                    size="md"
                    className="textarea-glow"
                    bg="rgba(255, 255, 255, 0.9)"
                    color="black"
                    border="1px solid rgba(255, 255, 255, 0.3)"
                    borderRadius="md"
                    _focus={{ borderColor: 'white' }}
                    minH="150px"
                  />
                </Box>

                <Box display="flex" justifyContent="center" mt={4}>
                  <Button
                    bgGradient="linear(to-r, blue.500, teal.500)"
                    color="white"
                    _hover={{ bgGradient: "linear(to-r, blue.600, teal.600)" }}
                    size="lg"
                    onClick={handleStartMapping}
                    className="button-glow"
                  >
                    Start Mapping
                  </Button>
                </Box>
              </VStack>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default AddScenario;