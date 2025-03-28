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
    <Box display="flex" h="100vh" overflow="hidden">
      <Sidebar />
      <Box flex="1" bg="gray.50" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" px={6} py={4} overflowY="auto">
          {/* Page Header */}
          <Text fontSize="2xl" fontWeight="bold" color="blue.700" mb={6}>
            Documents
          </Text>

          {/* Upload Section */}
          <Card bg="white" boxShadow="sm" borderRadius="md" mb={6}>
            <CardHeader>
              <Text fontSize="lg" fontWeight="bold" color="blue.500">
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
                >
                  {projects.map((project) => (
                    <option key={project.project_id} value={project.project_id}>
                      {project.project_name}
                    </option>
                  ))}
                </Select>

                {/* BDD Files Input */}
                <Box>
                  <Text fontWeight="medium" mb={1}>
                    BDD Files:
                  </Text>
                  <Input
                    type="file"
                    accept=".feature"
                    onChange={(e) => setBddFiles(Array.from(e.target.files))}
                    variant="unstyled"
                    multiple
                  />
                  {bddFiles.length > 0 && (
                    <Text fontSize="sm" color="green.500" mt={1}>
                      {bddFiles.length} file(s) selected
                    </Text>
                  )}
                </Box>

                {/* Test Script Files Input */}
                <Box>
                  <Text fontWeight="medium" mb={1}>
                    Test Script Files:
                  </Text>
                  <Input
                    type="file"
                    accept=".java,.py"
                    onChange={(e) => setTestScriptFiles(Array.from(e.target.files))}
                    variant="unstyled"
                    multiple
                  />
                  {testScriptFiles.length > 0 && (
                    <Text fontSize="sm" color="green.500" mt={1}>
                      {testScriptFiles.length} file(s) selected
                    </Text>
                  )}
                </Box>

                <Button leftIcon={<FaUpload />} colorScheme="blue" onClick={handleUpload}>
                  Upload
                </Button>
                <Text fontSize="sm" color="gray.500">
                  Supported formats: BDD (.feature), Java (.java), Python (.py).
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Uploaded Files Table */}
          <Card bg="white" boxShadow="sm" borderRadius="md">
            <CardHeader>
              <Text fontSize="lg" fontWeight="bold" color="blue.500">
                Uploaded Files
              </Text>
            </CardHeader>
            <CardBody>
              {uploadedFiles.length === 0 ? (
                <Text color="gray.500" textAlign="center">
                  No files uploaded yet.
                </Text>
              ) : (
                <Table variant="striped" colorScheme="gray" size="sm">
                  <Thead>
                    <Tr>
                      <Th>File Name</Th>
                      <Th>Size</Th>
                      <Th>Type</Th>
                      <Th>Uploaded At</Th>
                      <Th>Project</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {uploadedFiles.map((file) => (
                      <Tr key={file.id}>
                        <Td>{file.name}</Td>
                        <Td>{file.size}</Td>
                        <Td>{file.type}</Td>
                        <Td>{file.uploadedAt}</Td>
                        <Td>{file.project}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<FaEye />}
                              colorScheme="blue"
                              size="sm"
                              aria-label="View File"
                              onClick={() => handleViewFile(file.name)}
                            />
                            <IconButton
                              icon={<FaTrash />}
                              colorScheme="red"
                              size="sm"
                              aria-label="Delete File"
                              onClick={() => handleDelete(file.id)}
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
  );
};

export default Documents;