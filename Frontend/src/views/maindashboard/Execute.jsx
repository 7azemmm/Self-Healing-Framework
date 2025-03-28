import {
  Box,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  List,
  ListItem,
  ListIcon,
  Select,
  Input, // Added Input for execution name
  useToast,
} from "@chakra-ui/react";
import { WarningIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import { useState, useEffect } from "react";
import axios from "axios";

const Execute = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [testResults, setTestResults] = useState({
    success: false,
    passedElements: 0,
    failedElements: 0,
    executionTime: "0 seconds",
    logs: [],
    failedDetails: [],
  });
  const [selectedProject, setSelectedProject] = useState("");
  const [executionName, setExecutionName] = useState(""); // New state for execution name
  const [projects, setProjects] = useState([]);
  const toast = useToast();

  // Fetch projects from the backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/get_projects/");
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
        "http://localhost:8000/api/execute_tests/",
        {
          project_id: selectedProject,
          execution_name: executionName || "Default Execution", // Send execution_name, fallback to default
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );

      setTestResults({
        success: response.data.success,
        passedElements: response.data.passedElements || 0, // Fallback if not provided
        failedElements: response.data.failedElements || 0,
        executionTime: response.data.executionTime || "0 seconds",
        logs: response.data.logs || [],
        failedDetails: response.data.failedDetails || [],
      });

      toast({
        title: "Test execution completed.",
        description: response.data.success ? "All tests passed!" : "Tests completed with healing.",
        status: response.data.success ? "success" : "warning",
        duration: 3000,
        isClosable: true,
      });

      const data = response.data.message;
      const parsedData = typeof data === "string" ? JSON.parse(data) : data;
      console.log(parsedData);

      if (parsedData.message) {
        // Case where no healing occurred
        toast({
          title: "Execution Report",
          description: parsedData.message,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Case where healing occurred
        const map = Object.keys(parsedData).map(oldId => {
          const newId = parsedData[oldId].new_strategies?.id || "unknown";
          return `${oldId} was fixed to ${newId}`;
        });
        console.log(map);
        map.forEach(element => {
          toast({
            title: "Strategy ID Fix",
            description: element,
            status: "info",
            duration: 3000,
            isClosable: true,
          });
        });
      }
    } catch (error) {
      console.log(error);
      toast({
        title: "Test execution failed.",
        description: error.response?.data?.detail || error.message,
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

          {/* Main Execution Controls */}
          <VStack align="stretch" mb={8} spacing={4}>
            {/* Dropdown to select a project */}
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

            {/* Input for execution name */}
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

          {/* Execution Insights */}
          <Box mb={8}>
            <Card bg="white" boxShadow="sm" borderRadius="md">
              <CardHeader>
                <Text fontSize="lg" fontWeight="bold" color="blue.500">
                  Test Execution Insights
                </Text>
              </CardHeader>
              <CardBody>
                {isExecuting && (
                  <Text color="yellow.500" fontSize="sm" mb={4}>
                    Test is currently running...
                  </Text>
                )}
                {!isExecuting && (
                  <>
                    <Text
                      color={testResults.success ? "green.500" : "red.500"}
                      fontSize="md"
                      mb={4}
                    >
                      {testResults.success
                        ? "All pages tested successfully!"
                        : "Some tests failed during execution."}
                    </Text>
                    <HStack spacing={6} mb={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.600">
                          Passed Elements
                        </Text>
                        <Text fontSize="2xl" fontWeight="bold" color="green.500">
                          {testResults.passedElements}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">
                          Failed Elements
                        </Text>
                        <Text fontSize="2xl" fontWeight="bold" color="red.500">
                          {testResults.failedElements}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">
                          Execution Time
                        </Text>
                        <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                          {testResults.executionTime}
                        </Text>
                      </Box>
                    </HStack>
                  </>
                )}
              </CardBody>
            </Card>
          </Box>

          {/* Failed Elements List */}
          {testResults.failedElements > 0 && (
            <Box>
              <Card bg="white" boxShadow="sm" borderRadius="md">
                <CardHeader>
                  <Text fontSize="lg" fontWeight="bold" color="red.500">
                    Failed Elements
                  </Text>
                </CardHeader>
                <CardBody>
                  <List spacing={3}>
                    {testResults.failedDetails.map((element, index) => (
                      <ListItem key={index}>
                        <HStack>
                          <ListIcon as={WarningIcon} color="red.500" />
                          <Text fontSize="sm" color="gray.600">
                            <strong>{element.id}</strong>: {element.issue}
                          </Text>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
                </CardBody>
              </Card>
            </Box>
          )}

          {/* Test Logs */}
          {testResults.logs && (
            <Box mt={8}>
              <Card bg="white" boxShadow="sm" borderRadius="md">
                <CardHeader>
                  <Text fontSize="lg" fontWeight="bold" color="blue.500">
                    Execution Logs
                  </Text>
                </CardHeader>
                <CardBody>
                  <List spacing={3}>
                    {testResults.logs.map((log, index) => (
                      <ListItem key={index}>
                        <HStack>
                          <ListIcon as={InfoOutlineIcon} color="blue.500" />
                          <Text fontSize="sm" color="gray.600">
                            {log}
                          </Text>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
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