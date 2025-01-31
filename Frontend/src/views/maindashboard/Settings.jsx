import {
    Box,
    Text,
    Switch,
    VStack,
    HStack,
    FormControl,
    FormLabel,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Card,
    CardHeader,
    CardBody,
    Button,
  } from "@chakra-ui/react";
  import Sidebar from "../common/Sidebar";
  import Navbar from "../common/Navbar";
  import { useState } from "react";
  
  const Settings = () => {
    // State for toggles and settings
    const [isSelfHealingEnabled, setIsSelfHealingEnabled] = useState(true);
    const [logLevel, setLogLevel] = useState(50); // Default log level (0 to 100)
    const [retryThreshold, setRetryThreshold] = useState(3); // Default retry threshold
  
    const handleSaveSettings = () => {
      alert("Settings saved successfully!");
      // Logic for saving settings goes here
    };
  
    return (
      <Box display="flex" h="100vh" overflow="hidden">
        <Sidebar />
        <Box flex="1" bg="gray.50" display="flex" flexDirection="column">
          <Navbar />
          <Box flex="1" px={6} py={4} overflowY="auto">
            {/* Page Header */}
            <Text fontSize="2xl" fontWeight="bold" color="blue.700" mb={6}>
              Settings
            </Text>
  
            {/* Settings Card */}
            <Card bg="white" boxShadow="sm" borderRadius="md">
              <CardHeader>
                <Text fontSize="lg" fontWeight="bold" color="blue.500">
                  General Settings
                </Text>
              </CardHeader>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  {/* Enable/Disable Self-Healing */}
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="self-healing" mb="0" fontSize="md">
                      Enable Self-Healing
                    </FormLabel>
                    <Switch
                      id="self-healing"
                      colorScheme="blue"
                      isChecked={isSelfHealingEnabled}
                      onChange={(e) => setIsSelfHealingEnabled(e.target.checked)}
                    />
                  </FormControl>
  
                  {/* Log Level Slider */}
                  <FormControl>
                    <FormLabel fontSize="md">Log Level</FormLabel>
                    <Slider
                      aria-label="log-level-slider"
                      defaultValue={logLevel}
                      min={0}
                      max={100}
                      step={10}
                      onChange={(value) => setLogLevel(value)}
                    >
                      <SliderTrack bg="gray.200">
                        <SliderFilledTrack bg="blue.400" />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                    <Text mt={2} fontSize="sm" color="gray.500">
                      Current Log Level: <strong>{logLevel}%</strong>
                    </Text>
                  </FormControl>
  
                  {/* Retry Threshold Selector */}
                  <FormControl>
                    <FormLabel fontSize="md">Retry Threshold</FormLabel>
                    <HStack spacing={4}>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() =>
                          setRetryThreshold((prev) =>
                            Math.max(1, prev - 1) // Minimum value is 1
                          )
                        }
                      >
                        -
                      </Button>
                      <Text fontSize="lg" fontWeight="bold">
                        {retryThreshold}
                      </Text>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() =>
                          setRetryThreshold((prev) => Math.min(10, prev + 1)) // Maximum value is 10
                        }
                      >
                        +
                      </Button>
                    </HStack>
                    <Text mt={2} fontSize="sm" color="gray.500">
                      Number of retries before marking a test as failed.
                    </Text>
                  </FormControl>
  
                  {/* Save Button */}
                  <Button
                    colorScheme="blue"
                    size="lg"
                    width="full"
                    onClick={handleSaveSettings}
                  >
                    Save Settings
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </Box>
        </Box>
      </Box>
    );
  };
  
  export default Settings;
  