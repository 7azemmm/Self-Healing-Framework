import { Box, VStack, Text, Input, Button, useToast } from "@chakra-ui/react";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import { useState } from "react";
import axios from "axios";

const CreateProject = () => {
  const [projectName, setProjectName] = useState("");
  const toast = useToast();

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in the project name.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const token = localStorage.getItem("access_token");

      const response = await axios.post(
        "/create_project/",
        {
          project_name: projectName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Success message
      toast({
        title: "Project Created",
        description: `Project '${response.data.project.name}' created successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Clear the input field
      setProjectName("");
    } catch (error) {
      // Error handling
      toast({
        title: "Error Creating Project",
        description: error.response?.data?.error || "An unknown error occurred.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
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

          .input-glow {
            transition: all 0.3s ease;
          }

          .input-glow:focus {
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
            transform: scale(1.02);
          }

          .gradient-text {
            background: linear-gradient(90deg, #ffffff, #e0e0e0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
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
            <Box
              className="glass-card fade-in"
              p={6}
              borderRadius="lg"
              h="100%"
              display="flex"
              flexDirection="column"
            >
              <Text
                fontSize="2xl"
                fontWeight="bold"
                mb={6}
                color="white"
                fontFamily="Poppins, sans-serif"
                className="gradient-text"
              >
                Create a New Project
              </Text>

              <VStack spacing={4} align="stretch" flex="1">
                <Box>
                  <Text
                    fontWeight="medium"
                    mb={1}
                    color="white"
                    fontFamily="Poppins, sans-serif"
                  >
                    Project Name:
                  </Text>
                  <Input
                    placeholder="Enter project name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    size="md"
                    className="input-glow"
                    bg="rgba(255, 255, 255, 0.9)"
                    color="black"
                    border="1px solid rgba(255, 255, 255, 0.3)"
                    borderRadius="md"
                    _focus={{ borderColor: 'white' }}
                  />
                </Box>

                <Button
                  bgGradient="linear(to-r, blue.500, teal.500)"
                  color="white"
                  _hover={{ bgGradient: "linear(to-r, blue.600, teal.600)" }}
                  size="lg"
                  onClick={handleCreateProject}
                  alignSelf="flex-start"
                  className="button-glow"
                >
                  Create Project
                </Button>
              </VStack>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default CreateProject;