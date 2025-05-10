import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Select,
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
  Input,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Spinner,
  Divider,
  Flex,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { FiEdit, FiSave, FiRefreshCw, FiInfo } from 'react-icons/fi';
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';
import axios from 'axios';

const UpdateMapping = () => {
  const toast = useToast();
  const [selectedProject, setSelectedProject] = useState('');
  const [executionSequenceNumber, setExecutionSequenceNumber] = useState('');
  const [executionSequences, setExecutionSequences] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingSequences, setIsLoadingSequences] = useState(false);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
  const [scenarioMappings, setScenariosMapping] = useState({});
  const [editableScenarios, setEditableScenarios] = useState({});
  const [isLoadingMapping, setIsLoadingMapping] = useState({});
  const [isSavingMapping, setIsSavingMapping] = useState({});

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
          setScenarios([]);
          setScenariosMapping({});
          setEditableScenarios({});
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
      setScenarios([]);
      setScenariosMapping({});
      setEditableScenarios({});
    }
  }, [selectedProject]);

  // Fetch scenarios when execution sequence number changes
  useEffect(() => {
    if (selectedProject && executionSequenceNumber) {
      const fetchScenarios = async () => {
        setIsLoadingScenarios(true);
        try {
          const response = await axios.get(
            `/get_execution_sequence_scenarios/${selectedProject}/${executionSequenceNumber}/`
          );
          setScenarios(response.data || []);
          setScenariosMapping({});
          setEditableScenarios({});
        } catch (error) {
          toast({
            title: 'Error fetching scenarios',
            description: error.message,
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          setScenarios([]);
        } finally {
          setIsLoadingScenarios(false);
        }
      };
      fetchScenarios();
    } else {
      setScenarios([]);
      setScenariosMapping({});
      setEditableScenarios({});
    }
  }, [selectedProject, executionSequenceNumber]);

  const fetchScenarioMapping = async (scenarioId) => {
    setIsLoadingMapping((prev) => ({ ...prev, [scenarioId]: true }));
    try {
      const response = await axios.get(`/get_scenario_mapping/${scenarioId}/`);
      setScenariosMapping((prev) => ({
        ...prev,
        [scenarioId]: response.data.mapping_file,
      }));
      setEditableScenarios((prev) => ({
        ...prev,
        [scenarioId]: JSON.parse(JSON.stringify(response.data.mapping_file)),
      }));
    } catch (error) {
      toast({
        title: 'Error fetching scenario mapping',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingMapping((prev) => ({ ...prev, [scenarioId]: false }));
    }
  };

  const handleUpdateMapping = async (scenarioId) => {
    setIsSavingMapping((prev) => ({ ...prev, [scenarioId]: true }));
    try {
      await axios.put(`/update_scenario_mapping/${scenarioId}/`, {
        mapping_file: editableScenarios[scenarioId],
      });
      
      // Update the stored mapping after successful save
      setScenariosMapping((prev) => ({
        ...prev,
        [scenarioId]: JSON.parse(JSON.stringify(editableScenarios[scenarioId])),
      }));
      
      toast({
        title: 'Mapping updated',
        description: 'Scenario mapping has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error updating mapping',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSavingMapping((prev) => ({ ...prev, [scenarioId]: false }));
    }
  };

  const handleInputChange = (scenarioId, rowIndex, columnIndex, value) => {
    setEditableScenarios((prev) => {
      const updatedMapping = [...prev[scenarioId]];
      updatedMapping[rowIndex][columnIndex] = value;
      return {
        ...prev,
        [scenarioId]: updatedMapping,
      };
    });
  };

  const hasChanges = (scenarioId) => {
    if (!scenarioMappings[scenarioId] || !editableScenarios[scenarioId]) return false;
    
    return JSON.stringify(scenarioMappings[scenarioId]) !== 
           JSON.stringify(editableScenarios[scenarioId]);
  };

  const resetChanges = (scenarioId) => {
    setEditableScenarios((prev) => ({
      ...prev,
      [scenarioId]: JSON.parse(JSON.stringify(scenarioMappings[scenarioId])),
    }));
    
    toast({
      title: 'Changes reset',
      description: 'Your changes have been discarded',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
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
            Update Mapping
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
                Select Project and Execution Sequence
              </Text>
            </CardHeader>
            <CardBody py={6}>
              <VStack spacing={5} align="stretch">
                <Box>
                  <Select
                    placeholder="Select Project"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    bg="white"
                    border="1px solid #e2e8f0"
                    _hover={{ borderColor: '#3182ce' }}
                    _focus={{ borderColor: '#3182ce', boxShadow: '0 0 0 1px #3182ce' }}
                    isDisabled={isLoadingProjects}
                  >
                    {projects.map((project) => (
                      <option key={project.project_id} value={project.project_id}>
                        {project.project_name}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box>
                  <Select
                    placeholder="Select Execution Sequence Number"
                    value={executionSequenceNumber}
                    onChange={(e) => setExecutionSequenceNumber(e.target.value)}
                    bg="white"
                    border="1px solid #e2e8f0"
                    _hover={{ borderColor: '#3182ce' }}
                    _focus={{ borderColor: '#3182ce', boxShadow: '0 0 0 1px #3182ce' }}
                    isDisabled={!selectedProject || executionSequences.length === 0 || isLoadingSequences}
                  >
                    {executionSequences.map((sequence) => (
                      <option key={sequence.execution_sequence_id} value={sequence.number}>
                        {sequence.number}
                      </option>
                    ))}
                  </Select>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {isLoadingScenarios ? (
            <Flex justify="center" align="center" my={10}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
            </Flex>
          ) : scenarios.length > 0 ? (
            <Accordion allowMultiple>
              {scenarios.map((scenario) => (
                <AccordionItem
                  key={scenario.scenario_id}
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="md"
                  mb={4}
                  bg="white"
                  boxShadow="sm"
                >
                  <h2>
                    <AccordionButton
                      py={4}
                      _expanded={{ bg: 'blue.50', color: 'blue.700' }}
                      onClick={() => {
                        if (!scenarioMappings[scenario.scenario_id]) {
                          fetchScenarioMapping(scenario.scenario_id);
                        }
                      }}
                    >
                      <Box flex="1" textAlign="left" fontWeight="semibold">
                        <HStack>
                          <Text>{scenario.scenarios_name}</Text>
                          <Badge colorScheme="blue" ml={2}>
                            Order: {scenario.order}
                          </Badge>
                          {hasChanges(scenario.scenario_id) && (
                            <Badge colorScheme="orange" ml={2}>
                              Unsaved Changes
                            </Badge>
                          )}
                        </HStack>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4} px={0}>
                    {isLoadingMapping[scenario.scenario_id] ? (
                      <Flex justify="center" align="center" my={4}>
                        <Spinner size="md" color="blue.500" />
                      </Flex>
                    ) : editableScenarios[scenario.scenario_id] ? (
                      <Box>
                        <HStack spacing={4} mb={4} px={4}>
                          <Button
                            leftIcon={<FiSave />}
                            colorScheme="blue"
                            size="sm"
                            onClick={() => handleUpdateMapping(scenario.scenario_id)}
                            isLoading={isSavingMapping[scenario.scenario_id]}
                            isDisabled={!hasChanges(scenario.scenario_id)}
                          >
                            Save Changes
                          </Button>
                          <Button
                            leftIcon={<FiRefreshCw />}
                            colorScheme="gray"
                            size="sm"
                            onClick={() => resetChanges(scenario.scenario_id)}
                            isDisabled={!hasChanges(scenario.scenario_id)}
                          >
                            Reset Changes
                          </Button>
                          <Tooltip 
                            label="Edit the mapping data to update element locators. Changes will only be saved when you click 'Save Changes'."
                            placement="top"
                          >
                            <Box>
                              <Icon as={FiInfo} color="blue.500" />
                            </Box>
                          </Tooltip>
                        </HStack>
                        <Box overflowX="auto">
                          <Table size="sm" variant="simple">
                            <Thead bg="gray.50">
                              <Tr>
                                {editableScenarios[scenario.scenario_id][0].map((header, idx) => (
                                  <Th key={idx}>{header}</Th>
                                ))}
                              </Tr>
                            </Thead>
                            <Tbody>
                              {editableScenarios[scenario.scenario_id].slice(1).map((row, rowIdx) => (
                                <Tr key={rowIdx} _hover={{ bg: 'gray.50' }}>
                                  {row.map((cell, cellIdx) => (
                                    <Td key={cellIdx}>
                                      {cellIdx === 0 ? (
                                        // Step column is read-only
                                        <Text fontWeight={cell.startsWith('When') ? 'bold' : 'normal'}>
                                          {cell}
                                        </Text>
                                      ) : (
                                        <Input
                                          value={cell}
                                          onChange={(e) =>
                                            handleInputChange(
                                              scenario.scenario_id,
                                              rowIdx + 1,
                                              cellIdx,
                                              e.target.value
                                            )
                                          }
                                          size="sm"
                                          variant="outline"
                                          borderColor="gray.200"
                                          _hover={{ borderColor: 'blue.300' }}
                                          _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
                                        />
                                      )}
                                    </Td>
                                  ))}
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      </Box>
                    ) : (
                      <Box p={4}>
                        <Text color="gray.500">No mapping data available</Text>
                      </Box>
                    )}
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          ) : selectedProject && executionSequenceNumber ? (
            <Card bg="white" p={6} textAlign="center">
              <Text color="gray.500">No scenarios found for this execution sequence</Text>
            </Card>
          ) : (
            <Card bg="white" p={6} textAlign="center">
              <Text color="gray.500">Please select a project and execution sequence to view scenarios</Text>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default UpdateMapping;
