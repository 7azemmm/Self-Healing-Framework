import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  IconButton,
  Input,
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
} from "@chakra-ui/react";
import { FaUpload, FaTrash, FaEye } from "react-icons/fa";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import { useState, useEffect } from "react";
import axios from "axios";

const Documents = () => {
  const toast = useToast();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [projects, setProjects] = useState([]);
  const [bddFiles, setBddFiles] = useState([]);
  const [testScriptFiles, setTestScriptFiles] = useState([]);

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

    try {
      const response = await axios.post("/documents/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setUploadedFiles([...uploadedFiles, ...response.data]);
      toast({
        title: "Files uploaded successfully.",
        description: "All files have been uploaded.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setBddFiles([]);
      setTestScriptFiles([]);
    } catch (error) {
      toast({
        title: "Upload failed.",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/delete_document/${id}/`);
      setUploadedFiles(uploadedFiles.filter((file) => file.id !== id));
      toast({
        title: "File deleted.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Delete failed.",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleViewFile = (fileName) => {
    toast({
      title: `Viewing: ${fileName}`,
      description: "This is a placeholder for viewing file functionality.",
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

          .select-glow {
            transition: all 0.3s ease;
          }

          .select-glow:focus {
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
            transform: scale(1.02);
          }

          .file-input-wrapper {
            position: relative;
            padding: 10px;
            border: 2px dashed rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.05);
            transition: all 0.3s ease;
            cursor: pointer;
          }

          .file-input-wrapper:hover {
            border-color: rgba(255, 255, 255, 0.5);
            background: rgba(255, 255, 255, 0.1);
          }

          .file-input-wrapper input {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
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
              Documents
            </Text>

            {/* Upload Section */}
            <Card
              className="glass-card fade-in"
              borderRadius="lg"
              mb={6}
            >
              <CardHeader>
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color="white"
                  fontFamily="Poppins, sans-serif"
                >
                  Upload Documents
                </Text>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {/* Dropdown to select project */}
                  <Select
                    placeholder="Select Project"
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

                  {/* BDD Files Input */}
                  <Box>
                    <Text
                      fontWeight="medium"
                      mb={1}
                      color="white"
                      fontFamily="Poppins, sans-serif"
                    >
                      BDD Files:
                    </Text>
                    <Box className="file-input-wrapper">
                      <Text color="white" fontSize="sm">
                        {bddFiles.length > 0
                          ? `${bddFiles.length} file(s) selected`
                          : "Click to upload .feature files"}
                      </Text>
                      <Input
                        type="file"
                        accept=".feature"
                        onChange={(e) => setBddFiles(Array.from(e.target.files))}
                        multiple
                      />
                    </Box>
                    {bddFiles.length > 0 && (
                      <Text fontSize="sm" color="blue.200" mt={1}>
                        {bddFiles.map(file => file.name).join(", ")}
                      </Text>
                    )}
                  </Box>

                  {/* Test Script Files Input */}
                  <Box>
                    <Text
                      fontWeight="medium"
                      mb={1}
                      color="white"
                      fontFamily="Poppins, sans-serif"
                    >
                      Test Script Files:
                    </Text>
                    <Box className="file-input-wrapper">
                      <Text color="white" fontSize="sm">
                        {testScriptFiles.length > 0
                          ? `${testScriptFiles.length} file(s) selected`
                          : "Click to upload .java or .py files"}
                      </Text>
                      <Input
                        type="file"
                        accept=".java,.py"
                        onChange={(e) => setTestScriptFiles(Array.from(e.target.files))}
                        multiple
                      />
                    </Box>
                    {testScriptFiles.length > 0 && (
                      <Text fontSize="sm" color="blue.200" mt={1}>
                        {testScriptFiles.map(file => file.name).join(", ")}
                      </Text>
                    )}
                  </Box>

                  <Button
                    leftIcon={<FaUpload />}
                    bgGradient="linear(to-r, blue.500, teal.500)"
                    color="white"
                    _hover={{ bgGradient: "linear(to-r, blue.600, teal.600)" }}
                    className="button-glow"
                    onClick={handleUpload}
                  >
                    Upload
                  </Button>
                  <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)">
                    Supported formats: BDD (.feature), Java (.java), Python (.py).
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            {/* Uploaded Files Table */}
            <Card className="glass-card fade-in" borderRadius="lg">
              <CardHeader>
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color="white"
                  fontFamily="Poppins, sans-serif"
                >
                  Uploaded Files
                </Text>
              </CardHeader>
              <CardBody>
                {uploadedFiles.length === 0 ? (
                  <Text color="rgba(255, 255, 255, 0.6)" textAlign="center">
                    No files uploaded yet.
                  </Text>
                ) : (
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th color="white" borderColor="rgba(255, 255, 255, 0.2)">File Name</Th>
                        <Th color="white" borderColor="rgba(255, 255, 255, 0.2)">Size</Th>
                        <Th color="white" borderColor="rgba(255, 255, 255, 0.2)">Type</Th>
                        <Th color="white" borderColor="rgba(255, 255, 255, 0.2)">Uploaded At</Th>
                        <Th color="white" borderColor="rgba(255, 255, 255, 0.2)">Project</Th>
                        <Th color="white" borderColor="rgba(255, 255, 255, 0.2)">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {uploadedFiles.map((file) => (
                        <Tr key={file.id} className="table-row">
                          <Td color="white" borderColor="rgba(255, 255, 255, 0.2)">{file.name}</Td>
                          <Td color="white" borderColor="rgba(255, 255, 255, 0.2)">{file.size}</Td>
                          <Td color="white" borderColor="rgba(255, 255, 255, 0.2)">{file.type}</Td>
                          <Td color="white" borderColor="rgba(255, 255, 255, 0.2)">{file.uploadedAt}</Td>
                          <Td color="white" borderColor="rgba(255, 255, 255, 0.2)">{file.project}</Td>
                          <Td borderColor="rgba(255, 255, 255, 0.2)">
                            <HStack spacing={2}>
                              <IconButton
                                icon={<FaEye />}
                                bgGradient="linear(to-r, blue.500, teal.500)"
                                color="white"
                                _hover={{ bgGradient: "linear(to-r, blue.600, teal.600)" }}
                                size="sm"
                                aria-label="View File"
                                onClick={() => handleViewFile(file.name)}
                                className="button-glow"
                              />
                              <IconButton
                                icon={<FaTrash />}
                                bgGradient="linear(to-r, red.500, red.700)"
                                color="white"
                                _hover={{ bgGradient: "linear(to-r, red.600, red.800)" }}
                                size="sm"
                                aria-label="Delete File"
                                onClick={() => handleDelete(file.id)}
                                className="button-glow"
                              />
                            </HStack>
                          </Td>
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

export default Documents;