import {
  Box,
  Button,
  Input,
  Text,
  Textarea,
  VStack,
  useToast,
  Select,
  Card,
  CardHeader,
  CardBody,
  Icon,
  Spinner,
} from "@chakra-ui/react";
import { FiFileText, FiLink, FiPlay } from "react-icons/fi";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import { useState, useEffect } from "react";
import axios from "axios";

const AddScenario = () => {
  const [selectedProject, setSelectedProject] = useState("");
  const [scenario, setScenario] = useState("");
  const [urls, setUrls] = useState("");
  const [executionSequenceNumber, setExecutionSequenceNumber] = useState(""); // State for sequence number
  const [order, setOrder] = useState(""); // State for order
  const [scenariosName, setScenariosName] = useState(""); // New state for scenarios_name
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

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

    if (!executionSequenceNumber) {
      toast({
        title: "Execution Sequence Number Missing",
        description: "Please provide an execution sequence number.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!scenariosName.trim()) {
      toast({
        title: "Scenario Name Missing",
        description: "Please provide a scenario name.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/scenario/", {
        project_id: selectedProject,
        bdd: scenario,
        links: urls,
        execution_sequence_number: executionSequenceNumber, // Include sequence number
        order: order || null, // Send null if not provided
        scenarios_name: scenariosName, // Include scenarios_name
      });

      toast({
        title: "Mapping Finished",
        description: response.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Reset form after successful submission
      setScenario("");
      setUrls("");
      setExecutionSequenceNumber("");
      setOrder("");
      setScenariosName("");
    } catch (error) {
      toast({
        title: "Mapping Failed",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" h="100vh" overflow="hidden">
      <Sidebar />
      <Box
        ml={{ base: "60px", md: "240px" }}
        flex="1"
        bg="gray.50"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <Navbar />
        <Box flex="1" px={8} py={6} overflowY="auto">
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="#2d3748"
            letterSpacing="tight"
            mb={6}
          >
            Add New Scenario
          </Text>

          <Card
            bg="white"
            shadow="sm"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
          >
            <CardHeader>
              <Text fontSize="lg" fontWeight="semibold" color="#2d3748">
                Scenario Configuration
              </Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="#4A5568" mb={2}>
                    Select Project
                  </Text>
                  <Select
                    placeholder="Choose a project..."
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    _hover={{ borderColor: "blue.500" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  >
                    {projects.map((project) => (
                      <option key={project.project_id} value={project.project_id}>
                        {project.project_name}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="#4A5568" mb={2}>
                    Scenario Name
                  </Text>
                  <Input
                    placeholder="Enter scenario name..."
                    value={scenariosName}
                    onChange={(e) => setScenariosName(e.target.value)}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    _hover={{ borderColor: "blue.500" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  />
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="#4A5568" mb={2}>
                    Execution Sequence Number
                  </Text>
                  <Input
                    placeholder="Enter sequence number..."
                    value={executionSequenceNumber}
                    onChange={(e) => setExecutionSequenceNumber(e.target.value)}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    _hover={{ borderColor: "blue.500" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  />
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="#4A5568" mb={2}>
                    Order (optional)
                  </Text>
                  <Input
                    placeholder="Enter order..."
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    _hover={{ borderColor: "blue.500" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  />
                </Box>

                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color="#4A5568"
                    mb={2}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Icon as={FiFileText} />
                    BDD Scenario
                  </Text>
                  <Textarea
                    placeholder="Enter your BDD scenario here..."
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    minH="200px"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    _hover={{ borderColor: "blue.500" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    fontSize="sm"
                    fontFamily="mono"
                  />
                </Box>

                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color="#4A5568"
                    mb={2}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Icon as={FiLink} />
                    HTML Page URLs
                  </Text>
                  <Textarea
                    placeholder="Enter URLs (one per line)..."
                    value={urls}
                    onChange={(e) => setUrls(e.target.value)}
                    minH="150px"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    _hover={{ borderColor: "blue.500" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    fontSize="sm"
                    fontFamily="mono"
                  />
                </Box>

                <Button
                  leftIcon={loading ? <Spinner size="sm" /> : <Icon as={FiPlay} />}
                  colorScheme="blue"
                  size="lg"
                  onClick={handleStartMapping}
                  transition="all 0.2s"
                  _hover={{ transform: "translateY(-2px)", boxShadow: "sm" }}
                  isLoading={loading}
                  isDisabled={loading}
                >
                  {loading ? "Mapping in Progress..." : "Start Mapping"}
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default AddScenario;