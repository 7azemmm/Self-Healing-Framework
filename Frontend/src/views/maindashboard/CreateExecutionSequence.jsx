import {
    Box,
    Text,
    VStack,
    HStack,
    Button,
    Select,
    Input,
    useToast,
    Card,
    CardHeader,
    CardBody,
  } from "@chakra-ui/react";
  import Sidebar from "../common/Sidebar";
  import Navbar from "../common/Navbar";
  import { useState, useEffect } from "react";
  import axios from "axios";
 
  
  const CreateExecutionSequence = () => {
    const toast = useToast();

    const [selectedProject, setSelectedProject] = useState("");
    const [executionSequenceNumber, setExecutionSequenceNumber] = useState("");
    const [projects, setProjects] = useState([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    // Fetch projects on component mount
    useEffect(() => {
      const fetchProjects = async () => {
        setIsLoadingProjects(true);
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
        } finally {
          setIsLoadingProjects(false);
        }
      };
      fetchProjects();
    }, []);
  
    // Handle form submission to create execution sequence
    const handleCreateExecutionSequence = async () => {
      if (!selectedProject || !executionSequenceNumber) {
        toast({
          title: "Error",
          description: "Please select a project and enter an execution sequence number.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
  
      setIsSubmitting(true);
      try {
        const response = await axios.post("/create_execution_sequence/", {
          project_id: selectedProject,
          execution_sequence_number: executionSequenceNumber,
        });
  
        if (response.data.success) {
          toast({
            title: "Success",
            description: response.data.message,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          // Reset form and redirect to Update Order page
          setSelectedProject("");
          setExecutionSequenceNumber("");
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        toast({
          title: "Error creating execution sequence",
          description: error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsSubmitting(false);
      }
    };
  
    // Handle form reset
    const handleCancel = () => {
      setSelectedProject("");
      setExecutionSequenceNumber("");
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
            .create-button {
              transition: all 0.2s ease;
            }
            .create-button:hover {
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
                Create Execution Sequence
              </Text>
  
              <Card className="content-card" mb={6}>
                <CardHeader>
                  <Text fontSize="lg" fontWeight="semibold" color="#2d3748">
                    Create a New Execution Sequence
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
                      isDisabled={isLoadingProjects}
                    >
                      {projects.map((project) => (
                        <option key={project.project_id} value={project.project_id}>
                          {project.project_name}
                        </option>
                      ))}
                    </Select>
  
                    <Input
                      placeholder="Enter Execution Sequence Number (e.g., Sequence1)"
                      value={executionSequenceNumber}
                      onChange={(e) => setExecutionSequenceNumber(e.target.value)}
                      bg="white"
                      border="1px solid #e2e8f0"
                      _hover={{ borderColor: "#3182ce" }}
                      _focus={{ borderColor: "#3182ce", boxShellow: "0 0 0 1px #3182ce" }}
                    />
  
                    <HStack justify="flex-end">
                      <Button
                        colorScheme="blue"
                        className="create-button"
                        onClick={handleCreateExecutionSequence}
                        isLoading={isSubmitting}
                        isDisabled={!selectedProject || !executionSequenceNumber}
                      >
                        Create Execution Sequence
                      </Button>
                      <Button
                        colorScheme="gray"
                        className="create-button"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </Box>
          </Box>
        </Box>
      </>
    );
  };
  
  export default CreateExecutionSequence;