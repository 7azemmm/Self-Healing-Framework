import { Box, VStack, Text, Input, Button, useToast } from "@chakra-ui/react";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import { useState } from "react";
import axios from "axios";

const CreateProject = () => {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const toast = useToast();

  const handleCreateProject = async () => {
    if (!projectName.trim() || !projectDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await axios.post("http://localhost:8000/api/create_project/", {
        name: projectName,
        description: projectDescription,
      });
      toast({
        title: "Project Created",
        description: response.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setProjectName("");
      setProjectDescription("");
    } catch (error) {
      toast({
        title: "Error Creating Project",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box display="flex" h="100vh" overflow="hidden">
      <Sidebar />
      <Box flex="1" bg="gray.50" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" px={6} py={4} overflowY="auto">
          <Box bg="white" p={6} borderRadius="md" shadow="sm" h="100%" display="flex" flexDirection="column">
            <Text fontSize="xl" fontWeight="bold" mb={4} color="blue.700">
              Create a New Project
            </Text>
            
            <VStack spacing={4} align="stretch" flex="1">
              <Box>
                <Text fontWeight="medium" mb={1}>Project Name:</Text>
                <Input
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  size="md"
                  bg="gray.100"
                />
              </Box>
              
              <Box>
                <Text fontWeight="medium" mb={1}>Project Description:</Text>
                <Input
                  placeholder="Enter project description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  size="md"
                  bg="gray.100"
                />
              </Box>
              
              <Button colorScheme="blue" size="lg" onClick={handleCreateProject} alignSelf="flex-start">
                Create Project
              </Button>
            </VStack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateProject;