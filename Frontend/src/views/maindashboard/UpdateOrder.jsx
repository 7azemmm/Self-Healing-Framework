import {
    Box,
    Text,
    VStack,
    HStack,
    Button,
    Select,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    useToast,
    Card,
    CardHeader,
    CardBody,
    IconButton,
    Spinner,
  } from "@chakra-ui/react";
  import { FiArrowUp, FiArrowDown } from "react-icons/fi";
  import Sidebar from "../common/Sidebar";
  import Navbar from "../common/Navbar";
  import { useState, useEffect } from "react";
  import axios from "axios";
  import { Link } from "react-router-dom";
  
  const UpdateOrder = () => {
    const toast = useToast();
    const [selectedProject, setSelectedProject] = useState("");
    const [executionSequenceNumber, setExecutionSequenceNumber] = useState("");
    const [executionSequences, setExecutionSequences] = useState([]);
    const [scenarios, setScenarios] = useState([]);
    const [projects, setProjects] = useState([]);
    const [executionSequenceId, setExecutionSequenceId] = useState(null);
    const [isLoadingSequences, setIsLoadingSequences] = useState(false);
    const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
  
    // Fetch projects on component mount
    useEffect(() => {
      const fetchProjects = async () => {
        try {
          const response = await axios.get("/get_projects/");
          console.log("Projects response:", response.data);
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
  
    // Fetch execution sequence numbers when selectedProject changes
    useEffect(() => {
      if (selectedProject) {
        const fetchExecutionSequences = async () => {
          setIsLoadingSequences(true);
          try {
            const response = await axios.get(`/get_execution_sequences/${selectedProject}/`);
            console.log("Execution sequences response:", response.data);
            setExecutionSequences(response.data || []);
            setExecutionSequenceNumber("");
            setExecutionSequenceId(null);
            setScenarios([]);
          } catch (error) {
            toast({
              title: "Error fetching execution sequences",
              description: error.message,
              status: "error",
              duration: 3000,
              isClosable: true,
            });
            setExecutionSequences([]);
            setExecutionSequenceNumber("");
            setExecutionSequenceId(null);
            setScenarios([]);
          } finally {
            setIsLoadingSequences(false);
          }
        };
        fetchExecutionSequences();
      } else {
        setExecutionSequences([]);
        setExecutionSequenceNumber("");
        setExecutionSequenceId(null);
        setScenarios([]);
      }
    }, [selectedProject]);
  
    // Fetch scenarios when execution sequence number changes
    useEffect(() => {
      if (selectedProject && executionSequenceNumber) {
        const fetchData = async () => {
          setIsLoadingScenarios(true);
          try {
            // Set execution_sequence_id directly from executionSequences
            const selectedSequence = executionSequences.find(
              (seq) => seq.number === executionSequenceNumber
            );
            if (selectedSequence) {
              setExecutionSequenceId(selectedSequence.execution_sequence_id);
              console.log("Selected execution_sequence_id:", selectedSequence.execution_sequence_id);
            } else {
              throw new Error("Execution sequence not found in executionSequences");
            }
  
            // Fetch scenarios
            const scenariosResponse = await axios.get(
              `/get_execution_sequence_scenarios/${selectedProject}/${executionSequenceNumber}/`
            );
            console.log("Scenarios response:", scenariosResponse.data);
            setScenarios(scenariosResponse.data || []);
          } catch (error) {
            toast({
              title: "Error fetching data",
              description: error.message,
              status: "error",
              duration: 3000,
              isClosable: true,
            });
            setScenarios([]);
            setExecutionSequenceId(null);
          } finally {
            setIsLoadingScenarios(false);
          }
        };
        fetchData();
      } else {
        setScenarios([]);
        setExecutionSequenceId(null);
      }
    }, [selectedProject, executionSequenceNumber, executionSequences]);
  
    const moveScenario = (index, direction) => {
      const newScenarios = [...scenarios];
      if (direction === "up" && index > 0) {
        [newScenarios[index], newScenarios[index - 1]] = [newScenarios[index - 1], newScenarios[index]];
      } else if (direction === "down" && index < scenarios.length - 1) {
        [newScenarios[index], newScenarios[index + 1]] = [newScenarios[index + 1], newScenarios[index]];
      }
      const updatedScenarios = newScenarios.map((scenario, idx) => ({
        ...scenario,
        order: idx + 1,
      }));
      setScenarios(updatedScenarios);
    };
  
    const handleSaveOrder = async () => {
      if (!executionSequenceId) {
        toast({
          title: "Error",
          description: "Execution sequence ID not found",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
  
      const confirm = window.confirm("Are you sure you want to save the new order?");
      if (!confirm) return;
  
      const newOrder = scenarios.map((scenario) => ({
        scenario_id: scenario.scenario_id,
        order: scenario.order,
      }));
  
      try {
        const response = await axios.post("/update_scenario_order/", {
          execution_sequence_id: executionSequenceId,
          new_order: newOrder,
        });
  
        toast({
          title: "Success",
          description: response.data.message || "Order updated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        const errorMessage =
          error.response?.data?.error || error.response?.data?.message || error.message;
        toast({
          title: "Error updating order",
          description: errorMessage,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
  
    const resetOrder = () => {
      const resetScenarios = scenarios.map((scenario, idx) => ({
        ...scenario,
        order: idx + 1,
      }));
      setScenarios(resetScenarios);
    };
  
    return (
      <>
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .dashboard-bg {
              background: linear-gradient(to right, #f8fafc, #f1f5f9);
            }
            .content-card {
              background: white;
              border: 1px solid #e2e8f0;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              transition: all 0.2s ease;
            }
            .content-card:hover {
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            .table-row {
              transition: all 0.2s ease;
            }
            .table-row:hover {
              background: #f8fafc;
            }
            .arrow-button {
              transition: all 0.2s ease;
            }
            .arrow-button:hover {
              transform: scale(1.1);
            }
            .save-button {
              transition: all 0.2s ease;
            }
            .save-button:hover {
              transform: translateY(-2px);
            }
          `}
        </style>
  
        <Box display="flex" h="100vh" overflow="hidden">
          <Sidebar />
          <Box
            ml={{ base: "60px", md: "240px" }}
            flex="1"
            className="dashboard-bg"
            display="flex"
            flexDirection="column"
            overflow="hidden"
          >
            <Navbar />
            <Box flex="1" px={8} py={6} overflowY="auto">
              <Text fontSize="2xl" fontWeight="bold" mb={6} color="#1a365d" letterSpacing="tight">
                Update Scenario Order
              </Text>
  
              <Card className="content-card" mb={6}>
                <CardHeader>
                  <Text fontSize="lg" fontWeight="semibold" color="#2d3748">
                    Select Project and Execution Sequence
                  </Text>
                </CardHeader>
                <CardBody>
                  <VStack spacing={5} align="stretch">
                    <Select
                      placeholder="Select Project"
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      bg="white"
                      border="1px solid #e2e8f0"
                      _hover={{ borderColor: "#3182ce" }}
                      _focus={{ borderColor: "#3182ce", boxShadow: "0 0 0 1px #3182ce" }}
                    >
                      {projects.map((project) => (
                        <option key={project.project_id} value={project.project_id}>
                          {project.project_name}
                        </option>
                      ))}
                    </Select>
  
                    <Box>
                      <Select
                        placeholder="Select Execution Sequence Number"
                        value={executionSequenceNumber}
                        onChange={(e) => setExecutionSequenceNumber(e.target.value)}
                        bg="white"
                        border="1px solid #e2e8f0"
                        _hover={{ borderColor: "#3182ce" }}
                        _focus={{ borderColor: "#3182ce", boxShadow: "0 0 0 1px #3182ce" }}
                        isDisabled={!selectedProject || executionSequences.length === 0}
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
                          No execution sequences found for this project. Please upload documents in the{" "}
                          <Link to="/documents" style={{ color: "#3182ce", textDecoration: "underline" }}>
                            Documents
                          </Link>{" "}
                          page to create execution sequences.
                        </Text>
                      ) : null}
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
  
              <Card className="content-card">
                <CardHeader>
                  <HStack justify="space-between">
                    <Text fontSize="lg" fontWeight="semibold" color="#2d3748">
                      Scenarios
                    </Text>
                    {scenarios.length > 0 && (
                      <>
                        <Button
                          colorScheme="blue"
                          className="save-button"
                          onClick={handleSaveOrder}
                          mr={2}
                        >
                          Save Order
                        </Button>
                        <Button
                          colorScheme="gray"
                          className="save-button"
                          onClick={resetOrder}
                        >
                          Reset Order
                        </Button>
                      </>
                    )}
                  </HStack>
                </CardHeader>
                <CardBody>
                  {isLoadingScenarios ? (
                    <Spinner size="sm" color="#3182ce" />
                  ) : scenarios.length === 0 ? (
                    <Text color="#4a5568" textAlign="center" py={8}>
                      No scenarios found. Please select a project and execution sequence.
                    </Text>
                  ) : (
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th color="#4a5568">Actions</Th>
                          <Th color="#4a5568">Order</Th>
                          <Th color="#4a5568">Scenario ID</Th>
                          <Th color="#4a5568">Project</Th>
                          <Th color="#4a5568">Created At</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {scenarios.map((scenario, index) => (
                          <Tr key={scenario.scenario_id} className="table-row">
                            <Td>
                              <HStack spacing={2}>
                                <IconButton
                                  icon={<FiArrowUp />}
                                  aria-label="Move up"
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                  isDisabled={index === 0}
                                  onClick={() => moveScenario(index, "up")}
                                  className="arrow-button"
                                />
                                <IconButton
                                  icon={<FiArrowDown />}
                                  aria-label="Move down"
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                  isDisabled={index === scenarios.length - 1}
                                  onClick={() => moveScenario(index, "down")}
                                  className="arrow-button"
                                />
                              </HStack>
                            </Td>
                            <Td color="#2d3748" fontWeight="medium">
                              {scenario.order}
                            </Td>
                            <Td color="#2d3748">{scenario.scenario_id}</Td>
                            <Td color="#2d3748">{scenario.project_name}</Td>
                            <Td color="#2d3748">{scenario.created_at}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </Box>
          </Box>
        </Box>
      </>
    );
  };
  
  export default UpdateOrder;
  