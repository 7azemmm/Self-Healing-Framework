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
import { FaUpload, FaTrash, FaEye, FaFileUpload } from "react-icons/fa";
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

          .table-row {
            transition: background-color 0.2s ease;
          }

          .table-row:hover {
            background: #f8fafc;
          }

          .action-button {
            transition: all 0.2s ease;
          }

          .action-button:hover {
            transform: translateY(-1px);
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
            {/* Page Header */}
            <Text
              fontSize="2xl"
              fontWeight="bold"
              mb={6}
              color="#1a365d"
              letterSpacing="tight"
            >
              Document Management
            </Text>

            {/* Upload Section */}
            <Card className="content-card" mb={6}>
              <CardHeader>
                <Text
                  fontSize="lg"
                  fontWeight="semibold"
                  color="#2d3748"
                >
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
                    _focus={{
                      borderColor: "#3182ce",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                  >
                    {projects.map((project) => (
                      <option key={project.project_id} value={project.project_id}>
                        {project.project_name}
                      </option>
                    ))}
                  </Select>

         {/* BDD Files Upload */}
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
        onChange={(e) => setBddFiles(Array.from(e.target.files))}
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
      {bddFiles.map(file => file.name).join(", ")}
    </Text>
  )}
</Box>

{/* Test Script Files Upload */}
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
        onChange={(e) => setTestScriptFiles(Array.from(e.target.files))}
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
      {testScriptFiles.map(file => file.name).join(", ")}
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

            {/* Uploaded Files Table */}
            <Card className="content-card">
              <CardHeader>
                <Text
                  fontSize="lg"
                  fontWeight="semibold"
                  color="#2d3748"
                >
                  Uploaded Files
                </Text>
              </CardHeader>
              <CardBody>
                {uploadedFiles.length === 0 ? (
                  <Text color="#4a5568" textAlign="center" py={8}>
                    No files have been uploaded yet.
                  </Text>
                ) : (
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th color="#4a5568">File Name</Th>
                        <Th color="#4a5568">Size</Th>
                        <Th color="#4a5568">Type</Th>
                        <Th color="#4a5568">Uploaded At</Th>
                        <Th color="#4a5568">Project</Th>
                        <Th color="#4a5568">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {uploadedFiles.map((file) => (
                        <Tr key={file.id} className="table-row">
                          <Td color="#2d3748">{file.name}</Td>
                          <Td color="#2d3748">{file.size}</Td>
                          <Td color="#2d3748">{file.type}</Td>
                          <Td color="#2d3748">{file.uploadedAt}</Td>
                          <Td color="#2d3748">{file.project}</Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                icon={<FaEye />}
                                colorScheme="blue"
                                variant="ghost"
                                size="sm"
                                aria-label="View File"
                                onClick={() => handleViewFile(file.name)}
                                className="action-button"
                              />
                              <IconButton
                                icon={<FaTrash />}
                                colorScheme="red"
                                variant="ghost"
                                size="sm"
                                aria-label="Delete File"
                                onClick={() => handleDelete(file.id)}
                                className="action-button"
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




