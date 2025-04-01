import {
  Box,
  Text,
  Button,
  VStack,
  Card,
  CardBody,
  CardHeader,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Input,
  useToast,
} from "@chakra-ui/react";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import { useState, useEffect } from "react";
import axios from "axios";

const Execute = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [testResults, setTestResults] = useState({
    success: false,
    numberOfScenarios: 0,
    healingReport: null,
  });
  const [selectedProject, setSelectedProject] = useState("");
  const [executionName, setExecutionName] = useState("");
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

  const handleRunTest = async () => {
    if (!selectedProject) {
      toast({
        title: "No project selected.",
        description: "Please select a project to execute tests.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsExecuting(true);

    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        "/execute_tests/",
        {
          project_id: selectedProject,
          execution_name: executionName || "Default Execution",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const message = response.data.message;
      let healingReport;
      let numberOfScenarios = 0;
      if (typeof message === "string") {
        healingReport = JSON.parse(message);
        numberOfScenarios = Object.keys(healingReport).length > 0 ? 1 : 0; // Approximate; adjust if backend provides exact count
      } else {
        healingReport = message;
        numberOfScenarios = 0; // No healing implies scenarios ran without issues
      }

      setTestResults({
        success: response.data.success,
        numberOfScenarios: numberOfScenarios,
        healingReport: healingReport,
      });

      if (healingReport.message) {
        toast({
          title: "Execution Complete",
          description: healingReport.message,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        const healedCount = Object.keys(healingReport).length;
        toast({
          title: "Tests completed with healing",
          description: `Healed ${healedCount} elements across ${numberOfScenarios} scenarios.`,
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      toast({
        title: "Test execution failed.",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStopExecution = () => {
    setIsExecuting(false);
    toast({
      title: "Execution stopped.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box display="flex" h="100vh" overflow="hidden">
      <Sidebar />
      <Box flex="1" bg="gray.50" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" px={6} py={4} overflowY="auto">
          {/* Page Header */}
          <Text fontSize="2xl" fontWeight="bold" color="blue.700" mb={4}>
            Execute Test Scenarios
          </Text>

          {/* Execution Controls */}
          <VStack align="stretch" mb={8} spacing={4}>
            <Select
              placeholder="Select Project to Execute"
              onChange={(e) => setSelectedProject(e.target.value)}
              value={selectedProject}
            >
              {projects.map((project) => (
                <option key={project.project_id} value={project.project_id}>
                  {project.project_name}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Enter Execution Name (optional)"
              value={executionName}
              onChange={(e) => setExecutionName(e.target.value)}
            />
            <Button
              colorScheme="blue"
              size="lg"
              onClick={handleRunTest}
              isDisabled={isExecuting}
            >
              {isExecuting ? "Running..." : "Run Tests"}
            </Button>
            <Button
              colorScheme="red"
              size="lg"
              onClick={handleStopExecution}
              isDisabled={!isExecuting}
            >
              Stop Execution
            </Button>
          </VStack>

          {/* Test Execution Insights */}
          {!isExecuting && testResults.healingReport && (
            <Box mb={8}>
              <Card bg="white" boxShadow="sm" borderRadius="md">
                <CardHeader>
                  <Text fontSize="lg" fontWeight="bold" color="blue.500">
                    Test Execution Insights
                  </Text>
                </CardHeader>
                <CardBody>
                  {testResults.healingReport.message ? (
                    <VStack align="start" spacing={2}>
                      <Text color="green.500" fontSize="md">
                        {testResults.healingReport.message}
                      </Text>
                      <Text fontSize="md">
                        Number of scenarios executed: {testResults.numberOfScenarios}
                      </Text>
                    </VStack>
                  ) : (
                    <VStack align="start" spacing={4}>
                      <Text color="orange.500" fontSize="md">
                        Tests completed with healing
                      </Text>
                      <Text fontSize="md">
                        Number of scenarios executed: {testResults.numberOfScenarios}
                      </Text>
                      <Text fontSize="md">
                        Number of healed elements: {Object.keys(testResults.healingReport).length}
                      </Text>
                      <Table size="sm" variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Element ID</Th>
                            <Th>Timestamp</Th>
                            <Th>Original ID</Th>
                            <Th>New ID</Th>
                            <Th>Note</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {Object.entries(testResults.healingReport).map(([oldId, details]) => (
                            <Tr key={oldId}>
                              <Td>{oldId}</Td>
                              <Td>{details.timestamp}</Td>
                              <Td>{details.original_strategies.id}</Td>
                              <Td>{details.new_strategies.id}</Td>
                              <Td>{details.note}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </VStack>
                  )}
                </CardBody>
              </Card>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Execute;