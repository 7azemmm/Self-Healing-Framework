import {
  Box,
  VStack,
  Text,
  Input,
  Button,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Icon,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { FiFolder, FiPlus } from "react-icons/fi";
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

      toast({
        title: "Project Created",
        description: `Project '${response.data.project.name}' created successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setProjectName("");
    } catch (error) {
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
    <Box display="flex" h="100vh" overflow="hidden">
      <Sidebar />
      <Box
        ml={{ base: "60px", md: "240px" }}
        flex="1"
        bgGradient="linear(to-br, gray.50, blue.50)"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <Navbar />
        <Box
          flex="1"
          px={8}
          py={6}
          overflowY="auto"
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          {/* Page Header - Full Width */}
          <Box
            w="full"
            maxW="4xl"
            mb={6}
            p={4}
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
            border="1px solid"
            borderColor="gray.100"
          >
            <Text
              fontSize="2xl"
              fontWeight="bold"
              bgGradient="linear(to-r, blue.600, blue.800)"
              bgClip="text"
              letterSpacing="tight"
            >
              Create Project
            </Text>
          </Box>

          {/* Card - Full Width */}
          <Card
            w="full"
            maxW="4xl"
            bg="white"
            shadow="md"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            overflow="hidden"
          >
            <CardHeader
              borderBottom="1px solid"
              borderColor="gray.200"
              bgGradient="linear(to-r, blue.50, blue.100)"
              py={6}
            >
              <Text
                fontSize="lg"
                fontWeight="semibold"
                color="blue.800"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <Icon as={FiFolder} />
                Project Details
              </Text>
            </CardHeader>
            <CardBody
              py={10}
              px={8}
              bg="white"
            >
              <VStack spacing={8} align="stretch" maxW="3xl" mx="auto">
                <FormControl>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="medium"
                    color="gray.700"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    mb={3}
                  >
                    <Icon as={FiFolder} color="blue.500" />
                    Project Name
                  </FormLabel>
                  <InputGroup size="lg">
                    <InputLeftElement
                      pointerEvents="none"
                      color="blue.400"
                    >
                      <Icon as={FiFolder} />
                    </InputLeftElement>
                    <Input
                      placeholder="Enter project name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      pl="40px"
                      bg="white"
                      border="2px solid"
                      borderColor="gray.200"
                      _hover={{ borderColor: "blue.400" }}
                      _focus={{
                        borderColor: "blue.500",
                        boxShadow: "0 0 0 1px #3182ce"
                      }}
                      fontSize="md"
                    />
                  </InputGroup>
                </FormControl>

                <Button
                  leftIcon={<Icon as={FiPlus} />}
                  bgGradient="linear(to-r, blue.500, blue.600)"
                  color="white"
                  size="lg"
                  onClick={handleCreateProject}
                  transition="all 0.2s"
                  _hover={{
                    bgGradient: "linear(to-r, blue.600, blue.700)",
                    transform: "translateY(-2px)",
                    boxShadow: "lg"
                  }}
                  height="56px"
                  fontSize="md"
                >
                  Create Project
                </Button>
              </VStack>
            </CardBody>
          </Card>

          {/* Helper Text - Full Width */}
          <Box
            w="full"
            maxW="4xl"
            mt={6}
            p={4}
            bg="blue.50"
            borderRadius="lg"
            border="1px solid"
            borderColor="blue.100"
          >
            <Text
              color="blue.800"
              fontSize="sm"
              display="flex"
              alignItems="center"
              gap={2}
            >
              <Icon as={FiFolder} color="blue.500" />
              Create a new project to organize your test scenarios and executions.
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateProject;