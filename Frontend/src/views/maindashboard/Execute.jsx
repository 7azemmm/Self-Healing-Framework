import {
    Box,
    Text,
    Button,
    VStack,
    HStack,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Badge,
    List,
    ListItem,
    ListIcon,
    Icon,
  } from "@chakra-ui/react";
  import { CheckCircleIcon, WarningIcon, InfoOutlineIcon } from "@chakra-ui/icons";
  import Sidebar from "../common/Sidebar";
  import Navbar from "../common/Navbar";
  import { useState } from "react";
  
  const Execute = () => {
    // Test execution states
    const [isExecuting, setIsExecuting] = useState(false);
    const [testResults, setTestResults] = useState({
      success: false,
      passedElements: 7,
      failedElements: 2,
      executionTime: "15 seconds",
      logs: [
        "Test 1: Login button clicked successfully.",
        "Test 2: Email input validated successfully.",
        "Test 3: Submit button failed to respond.",
        "Test 4: Page navigation encountered an error.",
      ],
      failedDetails: [
        { id: "btn-submit", issue: "Button not clickable" },
        { id: "btn-next", issue: "Page navigation error" },
      ],
    });
  
    const handleRunTest = () => {
      setIsExecuting(true);
      // Simulate test execution
      setTimeout(() => {
        setIsExecuting(false);
      }, 3000); // Simulated execution time
    };
  
    const handleStopExecution = () => {
      setIsExecuting(false);
    };
  
    return (
      <Box display="flex" h="100vh" overflow="hidden">
        <Sidebar />
        <Box flex="1" bg="gray.50" display="flex" flexDirection="column">
          <Navbar />
          <Box flex="1" px={6} py={4} overflowY="auto">
            {/* Page Header */}
            <Text fontSize="2xl" fontWeight="bold" color="blue.700" mb={4}>
              Execute Test Scenarios
            </Text>
  
            {/* Main Execution Controls */}
            <VStack align="stretch" mb={8}>
              <Button
                colorScheme="blue"
                size="lg"
                onClick={handleRunTest}
                isDisabled={isExecuting}
              >
                {isExecuting ? "Running..." : "Run Tests"}
              </Button>
              <Button
                colorScheme="red"
                size="lg"
                onClick={handleStopExecution}
                isDisabled={!isExecuting}
              >
                Stop Execution
              </Button>
            </VStack>
  
            {/* Execution Insights */}
            <Box mb={8}>
              <Card bg="white" boxShadow="sm" borderRadius="md">
                <CardHeader>
                  <Text fontSize="lg" fontWeight="bold" color="blue.500">
                    Test Execution Insights
                  </Text>
                </CardHeader>
                <CardBody>
                  {isExecuting && (
                    <Text color="yellow.500" fontSize="sm" mb={4}>
                      Test is currently running...
                    </Text>
                  )}
                  {!isExecuting && (
                    <>
                      <Text
                        color={testResults.success ? "green.500" : "red.500"}
                        fontSize="md"
                        mb={4}
                      >
                        {testResults.success
                          ? "All pages tested successfully!"
                          : "Some tests failed during execution."}
                      </Text>
                      <HStack spacing={6} mb={4}>
                        <Box>
                          <Text fontSize="sm" color="gray.600">
                            Passed Elements
                          </Text>
                          <Text fontSize="2xl" fontWeight="bold" color="green.500">
                            {testResults.passedElements}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600">
                            Failed Elements
                          </Text>
                          <Text fontSize="2xl" fontWeight="bold" color="red.500">
                            {testResults.failedElements}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600">
                            Execution Time
                          </Text>
                          <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                            {testResults.executionTime}
                          </Text>
                        </Box>
                      </HStack>
                    </>
                  )}
                </CardBody>
              </Card>
            </Box>
  
            {/* Failed Elements List */}
            {testResults.failedElements > 0 && (
              <Box>
                <Card bg="white" boxShadow="sm" borderRadius="md">
                  <CardHeader>
                    <Text fontSize="lg" fontWeight="bold" color="red.500">
                      Failed Elements
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <List spacing={3}>
                      {testResults.failedDetails.map((element, index) => (
                        <ListItem key={index}>
                          <HStack>
                            <ListIcon as={WarningIcon} color="red.500" />
                            <Text fontSize="sm" color="gray.600">
                              <strong>{element.id}</strong>: {element.issue}
                            </Text>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                  </CardBody>
                </Card>
              </Box>
            )}
  
            {/* Test Logs */}
            {testResults.logs && (
              <Box mt={8}>
                <Card bg="white" boxShadow="sm" borderRadius="md">
                  <CardHeader>
                    <Text fontSize="lg" fontWeight="bold" color="blue.500">
                      Execution Logs
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <List spacing={3}>
                      {testResults.logs.map((log, index) => (
                        <ListItem key={index}>
                          <HStack>
                            <ListIcon as={InfoOutlineIcon} color="blue.500" />
                            <Text fontSize="sm" color="gray.600">
                              {log}
                            </Text>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                  </CardBody>
                </Card>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  };
  
  export default Execute;
  