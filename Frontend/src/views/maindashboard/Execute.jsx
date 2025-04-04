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
    numberOfScenarios: 0,
    healingReport: null,
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
        numberOfScenarios = Object.keys(healingReport).length > 0 ? 1 : 0;
      } else {
        healingReport = message;
        numberOfScenarios = 0;
      }

      setTestResults({
        success: response.data.success,
        numberOfScenarios,
        healingReport,
      });

      const healedCount = Object.keys(healingReport).length;

      if (healingReport.message) {
        toast({
          title: "Execution Complete",
          description: healingReport.message,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
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
            <Text fontSize="2xl" fontWeight="bold" color="#2d3748" letterSpacing="tight">
              Test Execution
            </Text>
            <Badge colorScheme={isExecuting ? "yellow" : "green"} fontSize="sm" px={3} py={1} borderRadius="full">
              {isExecuting ? "Running Tests" : "Ready"}
            </Badge>
          </HStack>

          {/* Config */}
          <Card mb={6} bg="white" shadow="sm" border="1px solid" borderColor="gray.200" borderRadius="lg">
            <CardHeader>
              <Text fontSize="lg" fontWeight="semibold" color="#2d3748">
                Test Configuration
              </Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
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
                <HStack spacing={4}>
                  <Button
                    leftIcon={<Icon as={FiPlay} />}
                    colorScheme="blue"
                    size="lg"
                    onClick={handleRunTest}
                    isDisabled={isExecuting}
                    flex={1}
                  >
                    {isExecuting ? "Running Tests..." : "Run Tests"}
                  </Button>
                  <Button
                    leftIcon={<Icon as={FiSquare} />}
                    colorScheme="red"
                    variant="outline"
                    size="lg"
                    onClick={handleStopExecution}
                    isDisabled={!isExecuting}
                    flex={1}
                  >
                    Stop Execution
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Results */}
          {!isExecuting && testResults.healingReport && (
            <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.200" borderRadius="lg">
              <CardHeader>
                <HStack justify="space-between">
                  <Text fontSize="lg" fontWeight="semibold" color="#2d3748">
                    Execution Results
                  </Text>
                  <Icon
                    as={testResults.success ? FiCheckCircle : FiAlertCircle}
                    color={testResults.success ? "green.500" : "orange.500"}
                    boxSize={5}
                  />
                </HStack>
              </CardHeader>
              <CardBody>
                {testResults.healingReport.message ? (
                  <VStack align="start" spacing={4}>
                    <Text color="gray.600">{testResults.healingReport.message}</Text>
                    <Badge colorScheme="blue" fontSize="sm">
                      Scenarios: {testResults.numberOfScenarios}
                    </Badge>
                  </VStack>
                ) : (
                  <VStack align="stretch" spacing={6}>
                    <HStack spacing={6}>
                      <Box>
                        <Text color="gray.500" fontSize="sm">Scenarios Executed</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="#2d3748">
                          {testResults.numberOfScenarios}
                        </Text>
                      </Box>
                      <Box>
                        <Text color="gray.500" fontSize="sm">Elements Healed</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="#2d3748">
                          {Object.keys(testResults.healingReport).length}
                        </Text>
                      </Box>
                    </HStack>

                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Element ID</Th>
                          <Th>Timestamp</Th>
                          <Th>Old CSS Selector</Th>
                          <Th>New CSS Selector</Th>
                          <Th>Old XPath</Th>
                          <Th>New XPath</Th>
                          <Th>Note</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {Object.entries(testResults.healingReport).map(([elementId, details]) => (
                          <Tr key={elementId}>
                            <Td>{elementId}</Td>
                            <Td>{details.timestamp || "N/A"}</Td>
                            <Td fontSize="xs" color="gray.600">{details.original_strategies['CSS Selector'] || "N/A"}</Td>
                            <Td fontSize="xs" color="gray.600">{details.new_strategies['CSS Selector'] || "N/A"}</Td>
                            <Td fontSize="xs" color="gray.600">{details.original_strategies['XPath (Absolute)'] || "N/A"}</Td>
                            <Td fontSize="xs" color="gray.600">{details.new_strategies['XPath (Absolute)'] || "N/A"}</Td>
                            <Td>{details.note || "N/A"}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </VStack>
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
