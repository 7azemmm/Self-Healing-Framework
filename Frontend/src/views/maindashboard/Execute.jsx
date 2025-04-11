// import {
//   Box,
//   Text,
//   Button,
//   VStack,
//   Card,
//   CardBody,
//   CardHeader,
//   Table,
//   Thead,
//   Tbody,
//   Tr,
//   Th,
//   Td,
//   Select,
//   Input,
//   useToast,
//   Icon,
//   HStack,
//   Badge,
// } from "@chakra-ui/react";
// import { FiPlay, FiSquare, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
// import Sidebar from "../common/Sidebar";
// import Navbar from "../common/Navbar";
// import { useState, useEffect } from "react";
// import axios from "axios";

// const Execute = () => {
//   const [isExecuting, setIsExecuting] = useState(false);
//   const [testResults, setTestResults] = useState({
//     success: false,
//     numberOfScenarios: 0,
//     healingReport: null,
//   });
//   const [selectedProject, setSelectedProject] = useState("");
//   const [executionName, setExecutionName] = useState("");
//   const [projects, setProjects] = useState([]);
//   const toast = useToast();

//   // Fetch projects from the backend
//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         const response = await axios.get("/get_projects/");
//         setProjects(response.data);
//       } catch (error) {
//         toast({
//           title: "Error fetching projects",
//           description: error.message,
//           status: "error",
//           duration: 3000,
//           isClosable: true,
//         });
//       }
//     };
//     fetchProjects();
//   }, []);

//   const handleRunTest = async () => {
//     if (!selectedProject) {
//       toast({
//         title: "No project selected.",
//         description: "Please select a project to execute tests.",
//         status: "error",
//         duration: 3000,
//         isClosable: true,
//       });
//       return;
//     }

//     setIsExecuting(true);

//     try {
//       const token = localStorage.getItem("access_token");
//       const response = await axios.post(
//         "/execute_tests/",
//         {
//           project_id: selectedProject,
//           execution_name: executionName || "Default Execution",
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       const message = response.data.message;
//       let healingReport;
//       let numberOfScenarios = 0;
//       if (typeof message === "string") {
//         healingReport = Object.entries(JSON.parse(message)).reduce((acc, [key, value]) => {
//           if (key !== "N/A") {
//             acc[key] = value;
//           }
//           return acc;
//         }, {});
//         numberOfScenarios = Object.keys(healingReport).length > 0 ? 1 : 0; // Approximate; adjust if backend provides exact count
//       } else {
//         healingReport = message;
//         numberOfScenarios = 0; // No healing implies scenarios ran without issues
//       }
//       setTestResults({
//         success: response.data.success,
//         numberOfScenarios: numberOfScenarios,
//         healingReport: healingReport,
//       });

//       if (healingReport.message) {
//         toast({
//           title: "Execution Complete",
//           description: healingReport.message,
//           status: "success",
//           duration: 3000,
//           isClosable: true,
//         });
//       } else {
//         const healedCount = Object.keys(healingReport).length;
//         toast({
//           title: "Tests completed with healing",
//           description: `Healed ${healedCount} elements across ${numberOfScenarios} scenarios.`,
//           status: "warning",
//           duration: 3000,
//           isClosable: true,
//         });
//       }
//     } catch (error) {
//       const errorMessage = error.response?.data?.error || error.message;
//       toast({
//         title: "Test execution failed.",
//         description: errorMessage,
//         status: "error",
//         duration: 3000,
//         isClosable: true,
//       });
//     } finally {
//       setIsExecuting(false);
//     }
//   };

//   const handleStopExecution = () => {
//     setIsExecuting(false);
//     toast({
//       title: "Execution stopped.",
//       status: "info",
//       duration: 3000,
//       isClosable: true,
//     });
//   };

//   return (
//     <Box display="flex" h="100vh" overflow="hidden">
//       <Sidebar />
//       <Box
//         ml={{ base: "60px", md: "240px" }}
//         flex="1"
//         bg="gray.50"
//         display="flex"
//         flexDirection="column"
//         overflow="hidden"
//       >
//         <Navbar />
//         <Box flex="1" px={8} py={6} overflowY="auto">
//           {/* Page Header */}
//           <HStack mb={8} justify="space-between">
//             <Text
//               fontSize="2xl"
//               fontWeight="bold"
//               color="#2d3748"
//               letterSpacing="tight"
//             >
//               Test Execution
//             </Text>
//             <Badge
//               colorScheme={isExecuting ? "yellow" : "green"}
//               fontSize="sm"
//               px={3}
//               py={1}
//               borderRadius="full"
//             >
//               {isExecuting ? "Running Tests" : "Ready"}
//             </Badge>
//           </HStack>

//           {/* Execution Controls */}
//           <Card
//             mb={6}
//             bg="white"
//             shadow="sm"
//             border="1px solid"
//             borderColor="gray.200"
//             borderRadius="lg"
//           >
//             <CardHeader>
//               <Text
//                 fontSize="lg"
//                 fontWeight="semibold"
//                 color="#2d3748"
//               >
//                 Test Configuration
//               </Text>
//             </CardHeader>
//             <CardBody>
//               <VStack spacing={4} align="stretch">
//                 <Select
//                   placeholder="Select Project to Execute"
//                   onChange={(e) => setSelectedProject(e.target.value)}
//                   value={selectedProject}
//                   bg="white"
//                   border="1px solid"
//                   borderColor="gray.200"
//                   _hover={{ borderColor: "blue.500" }}
//                   _focus={{
//                     borderColor: "blue.500",
//                     boxShadow: "0 0 0 1px #3182ce"
//                   }}
//                 >
//                   {projects.map((project) => (
//                     <option key={project.project_id} value={project.project_id}>
//                       {project.project_name}
//                     </option>
//                   ))}
//                 </Select>

//                 <Input
//                   placeholder="Enter Execution Name (optional)"
//                   value={executionName}
//                   onChange={(e) => setExecutionName(e.target.value)}
//                   bg="white"
//                   border="1px solid"
//                   borderColor="gray.200"
//                   _hover={{ borderColor: "blue.500" }}
//                   _focus={{
//                     borderColor: "blue.500",
//                     boxShadow: "0 0 0 1px #3182ce"
//                   }}
//                 />

//                 <HStack spacing={4}>
//                   <Button
//                     leftIcon={<Icon as={FiPlay} />}
//                     colorScheme="blue"
//                     size="lg"
//                     onClick={handleRunTest}
//                     isDisabled={isExecuting}
//                     flex={1}
//                     transition="all 0.2s"
//                     _hover={{
//                       transform: "translateY(-2px)",
//                       boxShadow: "sm"
//                     }}
//                   >
//                     {isExecuting ? "Running Tests..." : "Run Tests"}
//                   </Button>

//                   <Button
//                     leftIcon={<Icon as={FiSquare} />}
//                     colorScheme="red"
//                     variant="outline"
//                     size="lg"
//                     onClick={handleStopExecution}
//                     isDisabled={!isExecuting}
//                     flex={1}
//                     transition="all 0.2s"
//                     _hover={{
//                       transform: "translateY(-2px)",
//                       boxShadow: "sm"
//                     }}
//                   >
//                     Stop Execution
//                   </Button>
//                 </HStack>
//               </VStack>
//             </CardBody>
//           </Card>

//           {/* Test Results */}
//           {!isExecuting && testResults.healingReport && (
//             <Card
//               bg="white"
//               shadow="sm"
//               border="1px solid"
//               borderColor="gray.200"
//               borderRadius="lg"
//             >
//               <CardHeader>
//                 <HStack justify="space-between">
//                   <Text
//                     fontSize="lg"
//                     fontWeight="semibold"
//                     color="#2d3748"
//                   >
//                     Execution Results
//                   </Text>
//                   <Icon
//                     as={testResults.success ? FiCheckCircle : FiAlertCircle}
//                     color={testResults.success ? "green.500" : "orange.500"}
//                     boxSize={5}
//                   />
//                 </HStack>
//               </CardHeader>
//               <CardBody>
//                 {testResults.healingReport.message ? (
//                   <VStack align="start" spacing={4}>
//                     <Text color="gray.600">
//                       {testResults.healingReport.message}
//                     </Text>
//                     <Badge colorScheme="blue" fontSize="sm">
//                       Scenarios: {testResults.numberOfScenarios}
//                     </Badge>
//                   </VStack>
//                 ) : (
//                   <VStack align="stretch" spacing={6}>
//                     <HStack spacing={6}>
//                       <Box>
//                         <Text color="gray.500" fontSize="sm">Scenarios Executed</Text>
//                         <Text fontSize="2xl" fontWeight="bold" color="#2d3748">
//                           {testResults.numberOfScenarios}
//                         </Text>
//                       </Box>
//                       <Box>
//                         <Text color="gray.500" fontSize="sm">Elements Healed</Text>
//                         <Text fontSize="2xl" fontWeight="bold" color="#2d3748">
//                           {Object.keys(testResults.healingReport).length}
//                         </Text>
//                       </Box>
//                     </HStack>

//                     <Table variant="simple">
//   <Thead>
//     <Tr>
//       <Th>Element ID</Th>
//       <Th>Timestamp</Th>
//       <Th>Original ID</Th>
//       <Th>New ID</Th>
//       <Th>Original CSS Selector</Th>
//       <Th>New CSS Selector</Th>
//       <Th>Original XPath</Th>
//       <Th>New XPath</Th>
//       <Th>Note</Th>
//     </Tr>
//   </Thead>
//   <Tbody>
//     {Object.entries(testResults.healingReport).map(([oldId, details]) => (
//       <Tr
//         key={oldId}
//         _hover={{ bg: "gray.50" }}
//         transition="background-color 0.2s"
//       >
//         <Td>{oldId}</Td>
//         <Td>{details.timestamp}</Td>

//         <Td>
//           <Badge colorScheme="red" variant="subtle">
//             {details.original_strategies?.id || "N/A"}
//           </Badge>
//         </Td>
//         <Td>
//           <Badge colorScheme="green" variant="subtle">
//             {details.new_strategies?.id || "N/A"}
//           </Badge>
//         </Td>

//         <Td>
//           <Text fontSize="xs" color="gray.600">
//             {details.original_strategies?.cssSelector || "N/A"}
//           </Text>
//         </Td>
//         <Td>
//           <Text fontSize="xs" color="gray.600">
//             {details.new_strategies?.cssSelector || "N/A"}
//           </Text>
//         </Td>

//         <Td>
//           <Text fontSize="xs" color="gray.600">
//             {details.original_strategies?.xpath || "N/A"}
//           </Text>
//         </Td>
//         <Td>
//           <Text fontSize="xs" color="gray.600">
//             {details.new_strategies?.xpath || "N/A"}
//           </Text>
//         </Td>

//         <Td>{details.note}</Td>
//       </Tr>
//     ))}
//   </Tbody>
// </Table>

//                   </VStack>
//                 )}
//               </CardBody>
//             </Card>
//           )}
//         </Box>
//       </Box>
//     </Box>
//   );
// };

// export default Execute;


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
  Icon,
  HStack,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  TableContainer,
} from "@chakra-ui/react";
import { FiPlay, FiSquare, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import { useState, useEffect } from "react";
import axios from "axios";

const Execute = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [testResults, setTestResults] = useState({
    success: false,
    message: "",
    healedElements: [],
    brokenElements: [],
    metrics: {
      total_scenarios: 0,
      healed_count: 0,
      broken_count: 0,
    },
  });
  const [selectedProject, setSelectedProject] = useState("");
  const [executionName, setExecutionName] = useState("");
  const [projects, setProjects] = useState([]);
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

  const handleRunTest = async () => {
    if (!selectedProject) {
      toast({
        title: "No project selected",
        description: "Please select a project to execute tests",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsExecuting(true);
    setTestResults({
      success: false,
      message: "",
      healedElements: [],
      brokenElements: [],
      metrics: {
        total_scenarios: 0,
        healed_count: 0,
        broken_count: 0,
      },
    });

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

      const { success, message, healed_elements, broken_elements, metrics } = response.data;

      setTestResults({
        success,
        message: message || "Execution completed",
        healedElements: healed_elements || [],
        brokenElements: broken_elements || [],
        metrics: metrics || {
          total_scenarios: 0,
          healed_count: 0,
          broken_count: 0,
        },
      });

      // const healedCount = Object.keys(healingReport).length;

      toast({
        title: success ? "Success" : "Completed with issues",
        description: message || `Scenarios: ${metrics?.total_scenarios || 0} | Healed: ${metrics?.healed_count || 0} | Broken: ${metrics?.broken_count || 0}`,
        status: success ? "success" : broken_elements?.length ? "error" : "warning",
        duration: 5000,
        isClosable: true,
      });

    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message;

      setTestResults({
        success: false,
        message: errorMessage,
        healedElements: [],
        brokenElements: [],
        metrics: {
          total_scenarios: 0,
          healed_count: 0,
          broken_count: 0,
        },
      });

      toast({
        title: "Execution failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStopExecution = () => {
    setIsExecuting(false);
    toast({
      title: "Execution stopped",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const renderElementStrategies = (strategies) => {
    if (!strategies) return "N/A";
    return Object.entries(strategies).map(([key, value]) => (
      <Text key={key} fontSize="sm">
        <strong>{key}:</strong> {value}
      </Text>
    ));
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
          <HStack mb={8} justify="space-between">
            <Text fontSize="2xl" fontWeight="bold" color="#2d3748">
              Test Execution
            </Text>
            <Badge
              colorScheme={
                isExecuting ? "yellow" : 
                testResults.success ? "green" : 
                "red"
              }
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="full"
            >
              {isExecuting ? (
                <HStack spacing={2}>
                  <Spinner size="sm" />
                  <Text>Executing</Text>
                </HStack>
              ) : testResults.success ? "Success" : "Failed"}
            </Badge>
          </HStack>

          {/* Execution Controls */}
          <Card mb={6}>
            <CardHeader>
              <Text fontSize="lg" fontWeight="semibold">
                Test Configuration
              </Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Select
                  placeholder="Select Project"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  isDisabled={isExecuting}
                >
                  {projects.map((project) => (
                    <option key={project.project_id} value={project.project_id}>
                      {project.project_name}
                    </option>
                  ))}
                </Select>
                <Input
                  placeholder="Execution Name (optional)"
                  value={executionName}
                  onChange={(e) => setExecutionName(e.target.value)}
                  isDisabled={isExecuting}
                />
                <HStack spacing={4}>
                  <Button
                    leftIcon={<Icon as={FiPlay} />}
                    colorScheme="blue"
                    onClick={handleRunTest}
                    isLoading={isExecuting}
                    loadingText="Executing"
                    flex={1}
                  >
                    Run Tests
                  </Button>
                  <Button
                    leftIcon={<Icon as={FiSquare} />}
                    colorScheme="red"
                    variant="outline"
                    onClick={handleStopExecution}
                    isDisabled={!isExecuting}
                    flex={1}
                  >
                    Stop
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Results Section */}
          {testResults.message && (
            <Card>
              <CardHeader>
                <HStack justify="space-between">
                  <Text fontSize="lg" fontWeight="semibold">
                    Execution Results
                  </Text>
                  <Icon
                    as={testResults.success ? FiCheckCircle : FiAlertCircle}
                    color={testResults.success ? "green.500" : "red.500"}
                    boxSize={5}
                  />
                </HStack>
              </CardHeader>
              <CardBody>
                {/* Summary Message */}
                <Alert 
                  status={testResults.success ? "success" : "error"}
                  mb={4}
                  borderRadius="md"
                >
                  <AlertIcon />
                  {testResults.message}
                </Alert>

                {/* Metrics Summary */}
                <HStack spacing={6} mb={6}>
                  <Box textAlign="center">
                    <Text color="gray.500" fontSize="sm">Total Scenarios</Text>
                    <Text fontSize="2xl" fontWeight="bold">
                      {testResults.metrics.total_scenarios}
                    </Text>
                  </Box>
                  <Box textAlign="center">
                    <Text color="gray.500" fontSize="sm">Healed Elements</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">
                      {testResults.metrics.healed_count}
                    </Text>
                  </Box>
                  <Box textAlign="center">
                    <Text color="gray.500" fontSize="sm">Broken Elements</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="red.500">
                      {testResults.metrics.broken_count}
                    </Text>
                  </Box>
                </HStack>

                {/* Healed Elements Table */}
                {testResults.healedElements.length > 0 && (
                  <TableContainer mb={6}>
                    <Text fontWeight="semibold" mb={2} color="green.600">
                      Healed Elements
                    </Text>
                    <Table variant="striped" size="sm" colorScheme="green">
                      <Thead>
                        <Tr>
                          <Th>Element ID</Th>
                          <Th>Original Strategy</Th>
                          <Th>New Strategy</Th>
                          <Th>Timestamp</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {testResults.healedElements.map((element, index) => (
                          <Tr key={`healed-${index}`}>
                            <Td>{element.original_element_id}</Td>
                            <Td>
                              <Box>
                                {renderElementStrategies(element.original_strategies)}
                              </Box>
                            </Td>
                            <Td>
                              <Box>
                                {renderElementStrategies(element.new_strategies)}
                              </Box>
                            </Td>
                            <Td>{element.timestamp}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}

                {/* Broken Elements Table */}
                {testResults.brokenElements.length > 0 && (
                  <TableContainer>
                    <Text fontWeight="semibold" mb={2} color="red.600">
                      Broken Elements
                    </Text>
                    <Table variant="striped" size="sm" colorScheme="red">
                      <Thead>
                        <Tr>
                          <Th>Element ID</Th>
                          <Th>BDD Step</Th>
                          <Th>Strategy</Th>
                          <Th>Timestamp</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {testResults.brokenElements.map((element, index) => (
                          <Tr key={`broken-${index}`}>
                            <Td>{element.element_id}</Td>
                            <Td>{element.bdd_step}</Td>
                            <Td>
                              <Box>
                                {renderElementStrategies(element.original_strategies)}
                              </Box>
                            </Td>
                            <Td>{element.timestamp}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
              </CardBody>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Execute;
