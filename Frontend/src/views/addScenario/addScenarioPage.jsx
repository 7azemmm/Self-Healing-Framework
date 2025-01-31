import { Box, Button, Input, Text, Textarea, VStack, useToast } from "@chakra-ui/react";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import { useState } from "react";

const AddScenario = () => {
  const [scenario, setScenario] = useState("");
  const [urls, setUrls] = useState("");
  const toast = useToast();

  const handleStartMapping = () => {
    if (!scenario.trim() || !urls.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both the scenario and at least one URL.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    console.log("Scenario:", scenario);
    console.log("URLs:", urls.split("\n"));
    
    toast({
      title: "Mapping Started",
      description: "The system is processing the scenario.",
      status: "success",
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
          <Box bg="white" p={6} borderRadius="md" shadow="sm" h="100%" display="flex" flexDirection="column">
            <Text fontSize="xl" fontWeight="bold" mb={4} color="blue.700">
              Add a New Scenario
            </Text>
            
            <VStack spacing={4} align="stretch" flex="1">
              <Box>
                <Text fontWeight="medium" mb={1}>BDD Scenario:</Text>
                <Textarea
                  placeholder="Enter your scenario here..."
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  size="md"
                  bg="gray.100"
                />
              </Box>
              
              <Box>
                <Text fontWeight="medium" mb={1}>HTML Page URLs:</Text>
                <Textarea
                  placeholder="Enter URLs (one per line)..."
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  size="md"
                  bg="gray.100"
                />
              </Box>
              
              <Button colorScheme="blue" size="lg" onClick={handleStartMapping} alignSelf="flex-start">
                Start Mapping
              </Button>
            </VStack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AddScenario;
