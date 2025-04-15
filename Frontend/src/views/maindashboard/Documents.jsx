import {
  Box,
  Text,
  VStack,

  Button,

  Input,
  Select,
  
  useToast,
  Card,
  CardHeader,
  CardBody,
  Spinner,
} from "@chakra-ui/react";
import { FaUpload,  FaFileUpload } from "react-icons/fa";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Documents = () => {
  const toast = useToast();
  const [selectedProject, setSelectedProject] = useState("");
  const [executionSequenceNumber, setExecutionSequenceNumber] = useState("");
  const [executionSequences, setExecutionSequences] = useState([]);
  const [scenariosName, setScenariosName] = useState("");
  const [projects, setProjects] = useState([]);
  const [bddFiles, setBddFiles] = useState([]);
  const [testScriptFiles, setTestScriptFiles] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingSequences, setIsLoadingSequences] = useState(false);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  // Validate file sizes and show toast for oversized files
  const validateFiles = (files, toast) => {
    const validFiles = [];
    const oversizedFiles = [];

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        oversizedFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (oversizedFiles.length > 0) {
      toast({
        title: "File Size Exceeded",
        description: `The following files exceed the 10 MB limit: ${oversizedFiles.join(", ")}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }

    return validFiles;
  };

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoadingProjects(true);
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
          setExecutionSequenceNumber(""); // Reset selection when project changes
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
        } finally {
          setIsLoadingSequences(false);
        }
      };
      fetchExecutionSequences();
    } else {
      setExecutionSequences([]);
      setExecutionSequenceNumber("");
    }
  }, [selectedProject]);

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedProject) {
      toast({
        title: "No project selected.",
        description: "Please select a project before uploading files.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!executionSequenceNumber) {
      toast({
        title: "No execution sequence selected.",
        description: "Please select an execution sequence.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!scenariosName) {
      toast({
        title: "No scenario name provided.",
        description: "Please provide a scenario name.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (bddFiles.length === 0 || testScriptFiles.length === 0) {
      toast({
        title: "Missing files.",
        description: "Please upload at least one BDD file and one test script file.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const formData = new FormData();
    bddFiles.forEach((file, index) => {
      formData.append(`bdd_${index}`, file);
    });
    testScriptFiles.forEach((file, index) => {
      formData.append(`test_script_${index}`, file);
    });
    formData.append("project_id", selectedProject);
    formData.append("execution_sequence_number", executionSequenceNumber);
    formData.append("scenarios_name", scenariosName);

    try {
      const response = await axios.post("/documents/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "Files uploaded successfully.",
        description: response.data.message || "All files have been uploaded.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Reset form
      setBddFiles([]);
      setTestScriptFiles([]);
      setExecutionSequenceNumber("");
      setScenariosName("");
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || error.response?.data?.message || error.message;
      toast({
        title: "Upload failed.",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
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
          .file-upload-area {
            border: 2px dashed #e2e8f0;
            background: #f8fafc;
            transition: all 0.2s ease;
            cursor: pointer;
            padding: 20px;
            border-radius: 8px;
          }
          .file-upload-area:hover {
            border-color: #3182ce;
            background: #f1f5f9;
          }
          .upload-button {
            transition: all 0.2s ease;
          }
          .upload-button:hover {
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
              Document Management
            </Text>

            <Card className="content-card" mb={6}>
              <CardHeader>
                <Text fontSize="lg" fontWeight="semibold" color="#2d3748">
                  Upload Documents
                </Text>
              </CardHeader>
              <CardBody>
                <VStack spacing={5} align="stretch">
                  <Select
                    placeholder="Select Project"
                    onChange={(e) => setSelectedProject(e.target.value)}
                    value={selectedProject}
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

                  <Box>
                    <Select
                      placeholder="Select Execution Sequence"
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
                        No execution sequences found for this project. Please create one in the{" "}
                        <Link to="/create_execution_sequence" style={{ color: "#3182ce", textDecoration: "underline" }}>
                          Create Execution Sequence
                        </Link>{" "}
                        page.
                      </Text>
                    ) : null}
                  </Box>

                  <Input
                    placeholder="Scenario Name"
                    value={scenariosName}
                    onChange={(e) => setScenariosName(e.target.value)}
                    bg="white"
                    border="1px solid #e2e8f0"
                    _hover={{ borderColor: "#3182ce" }}
                    _focus={{ borderColor: "#3182ce", boxShadow: "0 0 0 1px #3182ce" }}
                  />

                  <Box>
                    <Text color="#4a5568" mb={2} fontWeight="medium">
                      BDD Files
                    </Text>
                    <label>
                      <Box className="file-upload-area" position="relative">
                        <VStack spacing={2} align="center">
                          <FaFileUpload size={24} color="#3182ce" />
                          <Text color="#4a5568" fontSize="sm">
                            {bddFiles.length > 0
                              ? `${bddFiles.length} file(s) selected`
                              : "Click here to upload .feature files"}
                          </Text>
                        </VStack>
                        <Input
                          type="file"
                          accept=".feature"
                          onChange={(e) => setBddFiles(validateFiles(e.target.files, toast))}
                          multiple
                          position="absolute"
                          top="0"
                          left="0"
                          width="100%"
                          height="100%"
                          opacity="0"
                          cursor="pointer"
                        />
                      </Box>
                    </label>
                    {bddFiles.length > 0 && (
                      <Text fontSize="sm" color="#3182ce" mt={2}>
                        {bddFiles.map((file) => file.name).join(", ")}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Text color="#4a5568" mb={2} fontWeight="medium">
                      Test Script Files
                    </Text>
                    <label>
                      <Box className="file-upload-area" position="relative">
                        <VStack spacing={2} align="center">
                          <FaFileUpload size={24} color="#3182ce" />
                          <Text color="#4a5568" fontSize="sm">
                            {testScriptFiles.length > 0
                              ? `${testScriptFiles.length} file(s) selected`
                              : "Click here to upload .java or .py files"}
                          </Text>
                        </VStack>
                        <Input
                          type="file"
                          accept=".java,.py"
                          onChange={(e) => setTestScriptFiles(validateFiles(e.target.files, toast))}
                          multiple
                          position="absolute"
                          top="0"
                          left="0"
                          width="100%"
                          height="100%"
                          opacity="0"
                          cursor="pointer"
                        />
                      </Box>
                    </label>
                    {testScriptFiles.length > 0 && (
                      <Text fontSize="sm" color="#3182ce" mt={2}>
                        {testScriptFiles.map((file) => file.name).join(", ")}
                      </Text>
                    )}
                  </Box>

                  <Button
                    leftIcon={<FaUpload />}
                    colorScheme="blue"
                    className="upload-button"
                    onClick={handleUpload}
                    size="lg"
                    width="full"
                  >
                    Upload Files
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Documents;