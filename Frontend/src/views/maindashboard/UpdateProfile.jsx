import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Heading,
  VStack,
  Card,
  CardBody,
  CardHeader,
  useToast,
  Text,
  InputGroup,
  InputRightElement,
  Icon,
  Flex,
  Divider,
} from '@chakra-ui/react';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { getUserData, updateProfile } from '../../services/auth/authService';
import Navbar from '../common/Navbar';
import Sidebar from '../common/Sidebar';

const UpdateProfile = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const toast = useToast();

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserData();
        setFullName(userData.full_name || '');
        setEmail(userData.email || '');
        setInitialLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setInitialLoading(false);
      }
    };

    fetchUserData();
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match if changing password
    if (password && password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      // Only include password if it's being changed
      const userData = {
        full_name: fullName,
        email: email,
        ...(password && { password }),
      };

      await updateProfile(userData);
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Clear password fields after successful update
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
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
        <Box flex="1" px={8} py={6} overflowY="auto">
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="#1a365d"
            letterSpacing="tight"
            mb={6}
          >
            Update Profile
          </Text>
          
          <Card
            bg="white"
            shadow="md"
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.200"
          >
            <CardHeader
              borderBottom="1px solid"
              borderColor="gray.200"
              bgGradient="linear(to-r, blue.50, blue.100)"
              py={4}
            >
              <Text
                fontSize="lg"
                fontWeight="semibold"
                color="blue.800"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <Icon as={FiUser} />
                Profile Information
              </Text>
            </CardHeader>
            <CardBody py={6}>
              {initialLoading ? (
                <Text>Loading profile data...</Text>
              ) : (
                <form onSubmit={handleSubmit}>
                  <VStack spacing={6} align="stretch" maxW="3xl" mx="auto">
                    <FormControl id="fullName">
                      <FormLabel fontWeight="medium" color="gray.700">Full Name</FormLabel>
                      <InputGroup>
                        <Input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter your full name"
                          bg="white"
                          border="1px solid"
                          borderColor="gray.200"
                          _hover={{ borderColor: "blue.500" }}
                          _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                        />
                      </InputGroup>
                    </FormControl>

                    <FormControl id="email">
                      <FormLabel fontWeight="medium" color="gray.700">Email Address</FormLabel>
                      <InputGroup>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          bg="white"
                          border="1px solid"
                          borderColor="gray.200"
                          _hover={{ borderColor: "blue.500" }}
                          _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                        />
                      </InputGroup>
                    </FormControl>

                    <Divider />
                    <Text fontWeight="medium" color="gray.700">Change Password (Optional)</Text>

                    <FormControl id="password">
                      <FormLabel fontWeight="medium" color="gray.700">New Password</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter new password"
                          bg="white"
                          border="1px solid"
                          borderColor="gray.200"
                          _hover={{ borderColor: "blue.500" }}
                          _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                          autoComplete="new-password"
                        />
                        <InputRightElement>
                          <Button
                            variant="ghost"
                            onClick={() => setShowPassword(!showPassword)}
                            size="sm"
                          >
                            <Icon as={showPassword ? FiEyeOff : FiEye} />
                          </Button>
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>

                    <FormControl id="confirmPassword">
                      <FormLabel fontWeight="medium" color="gray.700">Confirm New Password</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          bg="white"
                          border="1px solid"
                          borderColor="gray.200"
                          _hover={{ borderColor: "blue.500" }}
                          _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                          autoComplete="new-password"
                        />
                      </InputGroup>
                    </FormControl>

                    <Button
                      type="submit"
                      colorScheme="blue"
                      size="lg"
                      isLoading={loading}
                      loadingText="Updating..."
                      mt={4}
                      transition="all 0.2s"
                      _hover={{
                        transform: "translateY(-2px)",
                        boxShadow: "lg",
                      }}
                    >
                      Update Profile
                    </Button>
                  </VStack>
                </form>
              )}
            </CardBody>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default UpdateProfile;

