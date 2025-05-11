import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Select,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Divider,
  Flex,
  Icon,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';
import axios from 'axios';

const Execute = () => {
  const toast = useToast();
  const [selectedProject, setSelectedProject] = useState('');
  const [executionSequenceNumber, setExecutionSequenceNumber] = useState('');
  const [executionName, setExecutionName] = useState('');
  const [executionSequences, setExecutionSequences] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingSequences, setIsLoadingSequences] = useState(false);
  const [testResults, setTestResults] = useState(null);
  
  // New state for fine-tuning
  const [isFineTuning, setIsFineTuning] = useState(false);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const cancelRef = useRef();

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const response = await axios.get('/get_projects/');
        setProjects(response.data);
      } catch (error) {
        toast({
          title: 'Error fetching projects',
          description: error.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // Fetch execution sequences when selectedProject changes
  useEffect(() => {
    if (selectedProject) {
      const fetchExecutionSequences = async () => {
        setIsLoadingSequences(true);
        try {
          const response = await axios.get(`/get_execution_sequences/${selectedProject}/`);
          setExecutionSequences(response.data || []);
          setExecutionSequenceNumber('');
        } catch (error) {
          toast({
            title: 'Error fetching execution sequences',
            description: error.message,
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          setExecutionSequences([]);
        } finally {
          setIsLoadingSequences(false);
        }
      };
      fetchExecutionSequences();
    } else {
      setExecutionSequences([]);
      setExecutionSequenceNumber('');
    }
  }, [selectedProject]);

  const handleExecuteTests = async () => {
    if (!selectedProject || !executionSequenceNumber) {
      toast({
        title: 'Missing information',
        description: 'Please select a project and execution sequence',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    setTestResults(null);

    try {
      const response = await axios.post('/execute_tests/', {
        project_id: selectedProject,
        execution_sequence_number: executionSequenceNumber,
        execution_name: executionName || 'Default Execution',
      });

      setTestResults(response.data);

      toast({
        title: response.data.success ? 'Tests executed successfully' : 'Tests completed with issues',
        description: response.data.message,
        status: response.data.success ? 'success' : 'warning',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error executing tests',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // New functions for fine-tuning
  const handleAcceptHealing = async () => {
    setIsAcceptDialogOpen(false);
    setIsFineTuning(true);
    
    try {
      // Check if testResults contains execution_id
      if (!testResults || !testResults.execution_id) {
        throw new Error("Execution ID is missing from test results");
      }
      
      const response = await axios.post('/accept_healing/', {
        execution_id: testResults.execution_id,
        healed_elements: testResults.healed_elements,
      });
      
      toast({
        title: 'Healing accepted',
        description: response.data.message,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error accepting healing',
        description: error.response?.data?.error || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Accept healing error:', error.response?.data || error);
    } finally {
      setIsFineTuning(false);
    }
  };
  
  const handleRejectHealing = async () => {
    setIsRejectDialogOpen(false);
    setIsFineTuning(true);
    
    try {
      // Check if testResults contains execution_id
      if (!testResults || !testResults.execution_id) {
        throw new Error("Execution ID is missing from test results");
      }
      
      const response = await axios.post('/reject_healing/', {
        execution_id: testResults.execution_id,
        healed_elements: testResults.healed_elements,
      });
      
      toast({
        title: 'Healing rejected',
        description: response.data.message,
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error rejecting healing',
        description: error.response?.data?.error || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Reject healing error:', error.response?.data || error);
    } finally {
      setIsFineTuning(false);
    }
  };

  return (
    <Box display="flex" h="100vh" overflow="hidden">
      <Sidebar />
      <Box
        ml={{ base: '60px', md: '240px' }}
        flex="1"
        bgGradient="linear(to-br, gray.50, blue.50)"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <Navbar />
        <Box flex="1" px={8} py={6} overflowY="auto">
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="#1a365d"
            letterSpacing="tight"
            mb={6}
          >
            Execute Tests
          </Text>

          <Card
            bg="white"
            shadow="md"
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.200"
            mb={6}
          >
            <CardHeader
              borderBottom="1px solid"
              borderColor="gray.200"
              bgGradient="linear(to-r, blue.50, blue.100)"
              py={4}
            >
              <Text fontSize="lg" fontWeight="semibold" color="blue.800">
                Test Configuration
              </Text>
            </CardHeader>
            <CardBody py={6}>
              <VStack spacing={5} align="stretch">
                <Box>
                  <FormControl>
                    <FormLabel>Project</FormLabel>
                    <Select
                      placeholder="Select Project"
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      bg="white"
                      border="1px solid #e2e8f0"
                      _hover={{ borderColor: '#3182ce' }}
                      _focus={{ borderColor: '#3182ce', boxShadow: '0 0 0 1px #3182ce' }}
                      isDisabled={isLoading || isLoadingProjects}
                    >
                      {projects.map((project) => (
                        <option key={project.project_id} value={project.project_id}>
                          {project.project_name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <FormControl>
                    <FormLabel>Execution Sequence Number</FormLabel>
                    <Select
                      placeholder="Select Execution Sequence Number"
                      value={executionSequenceNumber}
                      onChange={(e) => setExecutionSequenceNumber(e.target.value)}
                      bg="white"
                      border="1px solid #e2e8f0"
                      _hover={{ borderColor: '#3182ce' }}
                      _focus={{ borderColor: '#3182ce', boxShadow: '0 0 0 1px #3182ce' }}
                      isDisabled={isLoading || !selectedProject || executionSequences.length === 0 || isLoadingSequences}
                    >
                      {executionSequences.map((sequence) => (
                        <option key={sequence.execution_sequence_id} value={sequence.number}>
                          {sequence.number}
                        </option>
                      ))}
                    </Select>
                    {isLoadingSequences ? (
                      <Spinner size="sm" color="#3182ce" mt={2} />
                    ) : selectedProject && executionSequences.length === 0 ? (
                      <Text fontSize="sm" color="#4a5568" mt={2}>
                        No execution sequences found for this project. Please create one in the Create Execution Sequence page.
                      </Text>
                    ) : null}
                  </FormControl>
                </Box>

                <Box>
                  <FormControl>
                    <FormLabel>Execution Name (Optional)</FormLabel>
                    <Input
                      placeholder="Enter a name for this execution"
                      value={executionName}
                      onChange={(e) => setExecutionName(e.target.value)}
                      bg="white"
                      border="1px solid #e2e8f0"
                      _hover={{ borderColor: '#3182ce' }}
                      _focus={{ borderColor: '#3182ce', boxShadow: '0 0 0 1px #3182ce' }}
                      isDisabled={isLoading}
                    />
                  </FormControl>
                </Box>

                <Box pt={2}>
                  <Button
                    colorScheme="blue"
                    size="md"
                    width="full"
                    onClick={handleExecuteTests}
                    isLoading={isLoading}
                    loadingText="Executing Tests..."
                    isDisabled={!selectedProject || !executionSequenceNumber || isLoadingProjects || isLoadingSequences}
                  >
                    Execute Tests
                  </Button>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {testResults && (
            <Card
              bg="white"
              shadow="md"
              borderRadius="lg"
              border="1px solid"
              borderColor="gray.200"
              mb={6}
            >
              <CardHeader
                borderBottom="1px solid"
                borderColor="gray.200"
                bgGradient={`linear(to-r, ${
                  testResults.success ? 'green.50, green.100' : 'orange.50, orange.100'
                })`}
                py={4}
              >
                <HStack>
                  <Icon
                    as={testResults.success ? FiCheckCircle : FiAlertTriangle}
                    color={testResults.success ? 'green.500' : 'orange.500'}
                    boxSize={5}
                  />
                  <Text fontSize="lg" fontWeight="semibold" color={testResults.success ? 'green.800' : 'orange.800'}>
                    Test Results
                  </Text>
                </HStack>
              </CardHeader>
              <CardBody py={6}>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Text fontSize="md" fontWeight="medium" mb={2}>
                      Execution Summary
                    </Text>
                    <HStack spacing={6} wrap="wrap">
                      <Badge colorScheme={testResults.success ? 'green' : 'orange'} p={2} borderRadius="md">
                        Status: {testResults.success ? 'Success' : 'Completed with Issues'}
                      </Badge>
                      <Badge colorScheme="blue" p={2} borderRadius="md">
                        Total Scenarios: {testResults.metrics.total_scenarios}
                      </Badge>
                      <Badge colorScheme="green" p={2} borderRadius="md">
                        Healed Elements: {testResults.metrics.healed_count}
                      </Badge>
                      <Badge colorScheme="red" p={2} borderRadius="md">
                        Broken Elements: {testResults.metrics.broken_count}
                      </Badge>
                    </HStack>
                  </Box>

                  {testResults.message && (
                    <Box>
                      <Text fontSize="md" fontWeight="medium" mb={2}>
                        Message
                      </Text>
                      <Text p={3} bg="gray.50" borderRadius="md">
                        {testResults.message}
                      </Text>
                    </Box>
                  )}

                  {/* Fine-tuning buttons */}
                  {testResults.healed_elements && testResults.healed_elements.length > 0 && (
                    <Box>
                      <Divider my={3} />
                      <Text fontSize="md" fontWeight="medium" mb={3}>
                        Fine-tune Model with Healing Results
                      </Text>
                      <HStack spacing={4}>
                        <Button
                          leftIcon={<FiCheckCircle />}
                          colorScheme="green"
                          onClick={() => setIsAcceptDialogOpen(true)}
                          isDisabled={isFineTuning}
                          isLoading={isFineTuning && isAcceptDialogOpen}
                          loadingText="Processing..."
                        >
                          Accept Healing
                        </Button>
                        <Button
                          leftIcon={<FiXCircle />}
                          colorScheme="red"
                          onClick={() => setIsRejectDialogOpen(true)}
                          isDisabled={isFineTuning}
                          isLoading={isFineTuning && isRejectDialogOpen}
                          loadingText="Processing..."
                        >
                          Reject Healing
                        </Button>
                        <Tooltip
                          label="Accept if elements were correctly healed to improve future healing. Reject if elements were incorrectly healed to prevent similar mistakes."
                          placement="top"
                          hasArrow
                        >
                          <Box>
                            <Icon as={FiInfo} color="blue.500" />
                          </Box>
                        </Tooltip>
                      </HStack>
                    </Box>
                  )}

                  {testResults.healed_elements && testResults.healed_elements.length > 0 && (
                    <Box>
                      <Text fontSize="md" fontWeight="medium" mb={2}>
                        Healed Elements ({testResults.healed_elements.length})
                      </Text>
                      <Box overflowX="auto">
                        <Table size="sm" variant="simple">
                          <Thead bg="gray.50">
                            <Tr>
                              <Th>Original Element ID</Th>
                              <Th>New Element ID</Th>
                              <Th>New CSS Selector</Th>
                              <Th>New XPath</Th>
                              <Th>Timestamp</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {testResults.healed_elements.map((element, index) => (
                              <Tr key={index}>
                                <Td>{element.original_element_id}</Td>
                                <Td>{element.new_strategies.id || 'N/A'}</Td>
                                <Td>{element.new_strategies['CSS Selector'] || 'N/A'}</Td>
                                <Td>{element.new_strategies['XPath (Absolute)'] || 'N/A'}</Td>
                                <Td>{new Date(element.timestamp).toLocaleString()}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    </Box>
                  )}

                  {testResults.broken_elements && testResults.broken_elements.length > 0 && (
                    <Box>
                      <Text fontSize="md" fontWeight="medium" mb={2}>
                        Broken Elements ({testResults.broken_elements.length})
                      </Text>
                      <Box overflowX="auto">
                        <Table size="sm" variant="simple">
                          <Thead bg="gray.50">
                            <Tr>
                              <Th>Element ID</Th>
                              <Th>BDD Step</Th>
                              <Th>Error</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {testResults.broken_elements.map((element, index) => (
                              <Tr key={index}>
                                <Td>{element.element_id}</Td>
                                <Td>{element.bdd_step}</Td>
                                <Td>{element.error}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
          )}
        </Box>
      </Box>

      {/* Accept Healing Confirmation Dialog */}
      <AlertDialog
        isOpen={isAcceptDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsAcceptDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Accept Healing Results
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to accept these healing results? This will fine-tune the model to improve similar healing in the future.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsAcceptDialogOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="green" onClick={handleAcceptHealing} ml={3}>
                Accept
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Reject Healing Confirmation Dialog */}
      <AlertDialog
        isOpen={isRejectDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsRejectDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Reject Healing Results
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to reject these healing results? This will fine-tune the model to avoid similar healing in the future.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleRejectHealing} ml={3}>
                Reject
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default Execute;
