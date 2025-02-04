import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  IconButton,
  Input,
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
import { useState } from "react";

const Documents = () => {
  const toast = useToast();
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newFiles = files.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024).toFixed(2) + " KB",
      type: file.type,
      uploadedAt: new Date().toLocaleString(),
    }));

    setUploadedFiles([...uploadedFiles, ...newFiles]);

    toast({
      title: "File uploaded successfully.",
      description: `${files.length} file(s) added.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDelete = (id) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.id !== id));
    toast({
      title: "File deleted.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
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
                <HStack spacing={4}>
                  <Input
                    type="file"
                    multiple
                    onChange={handleUpload}
                    variant="unstyled"
                    accept=".csv,.js,.feature"
                  />
                  <Button leftIcon={<FaUpload />} colorScheme="blue">
                    Upload
                  </Button>
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  Supported formats: CSV, JavaScript (Test Scripts), BDD
                  (.feature) files.
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
