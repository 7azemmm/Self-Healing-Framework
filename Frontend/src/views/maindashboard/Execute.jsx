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
        healingReport = Object.entries(JSON.parse(message)).reduce((acc, [key, value]) => {
          if (key !== "N/A") {
            acc[key] = value;
          }
          return acc;
        }, {});
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

          .select-glow, .input-glow {
            transition: all 0.3s ease;
          }

          .select-glow:focus, .input-glow:focus {
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
            transform: scale(1.02);
          }

          .gradient-text {
            background: linear-gradient(90deg, #ffffff, #e0e0e0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .table-row:hover {
            background: rgba(255, 255, 255, 0.05);
            transform: scale(1.01);
            transition: all 0.2s ease;
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
            {/* Page Header */}
            <Text
              fontSize="2xl"
              fontWeight="bold"
              mb={6}
              color="white"
              fontFamily="Poppins, sans-serif"
              className="gradient-text fade-in"
            >
              Execute Test Scenarios
            </Text>

            {/* Execution Controls */}
            <VStack align="stretch" mb={8} spacing={4} className="fade-in">
              <Select
                placeholder="Select Project to Execute"
                onChange={(e) => setSelectedProject(e.target.value)}
                value={selectedProject}
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
              <Input
                placeholder="Enter Execution Name (optional)"
                value={executionName}
                onChange={(e) => setExecutionName(e.target.value)}
                className="input-glow"
                bg="rgba(255, 255, 255, 0.9)"
                color="black"
                border="1px solid rgba(255, 255, 255, 0.3)"
                borderRadius="md"
                _focus={{ borderColor: 'white' }}
              />
              <Button
                bgGradient="linear(to-r, blue.500, teal.500)"
                color="white"
                _hover={{ bgGradient: "linear(to-r, blue.600, teal.600)" }}
                size="lg"
                onClick={handleRunTest}
                isDisabled={isExecuting}
                className="button-glow"
              >
                {isExecuting ? "Running..." : "Run Tests"}
              </Button>
              <Button
                bgGradient="linear(to-r, red.500, red.700)"
                color="white"
                _hover={{ bgGradient: "linear(to-r, red.600, red.800)" }}
                size="lg"
                onClick={handleStopExecution}
                isDisabled={!isExecuting}
                className="button-glow"
              >
                Stop Execution
              </Button>
            </VStack>

            {/* Test Execution Insights */}
            {!isExecuting && testResults.healingReport && (
              <Box mb={8} className="fade-in">
                <Card className="glass-card" borderRadius="lg">
                  <CardHeader>
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      color="white"
                      fontFamily="Poppins, sans-serif"
                    >
                      Test Execution Insights
                    </Text>
                  </CardHeader>
                  <CardBody>
                    {testResults.healingReport.message ? (
                      <VStack align="start" spacing={2}>
                        <Text color="blue.200" fontSize="md">
                          {testResults.healingReport.message}
                        </Text>
                        <Text fontSize="md" color="white">
                          Number of scenarios executed: {testResults.numberOfScenarios}
                        </Text>
                      </VStack>
                    ) : (
                      <VStack align="start" spacing={4}>
                        <Text color="blue.200" fontSize="md">
                          Tests completed with healing
                        </Text>
                        <Text fontSize="md" color="white">
                          Number of scenarios executed: {testResults.numberOfScenarios}
                        </Text>
                        <Text fontSize="md" color="white">
                          Number of healed elements: {Object.keys(testResults.healingReport).length}
                        </Text>
                        <Table size="sm">
                          <Thead>
                            <Tr>
                              <Th color="white" borderColor="rgba(255, 255, 255, 0.2)">Element ID</Th>
                              <Th color="white" borderColor="rgba(255, 255, 255, 0.2)">Timestamp</Th>
                              <Th color="white" borderColor="rgba(255, 255, 255, 0.2)">Original ID</Th>
                              <Th color="white" borderColor="rgba(255, 255, 255, 0.2)">New ID</Th>
                              <Th color="white" borderColor="rgba(255, 255, 255, 0.2)">Note</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {Object.entries(testResults.healingReport).map(([oldId, details]) => (
                              <Tr key={oldId} className="table-row">
                                <Td color="white" borderColor="rgba(255, 255, 255, 0.2)">{oldId}</Td>
                                <Td color="white" borderColor="rgba(255, 255, 255, 0.2)">{details.timestamp}</Td>
                                <Td color="white" borderColor="rgba(255, 255, 255, 0.2)">{details.original_strategies.id}</Td>
                                <Td color="white" borderColor="rgba(255, 255, 255, 0.2)">{details.new_strategies.id}</Td>
                                <Td color="white" borderColor="rgba(255, 255, 255, 0.2)">{details.note}</Td>
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
    </>
  );
};

export default Execute;