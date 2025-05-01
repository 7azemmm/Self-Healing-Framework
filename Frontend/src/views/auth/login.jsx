import React, { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Heading,
  Text,
  Link,
  Icon,
  Card,
  CardBody,
  VStack,
  useToast,
  FormErrorMessage,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { login } from '../../services/auth/authService';
import { FiMail, FiLock } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset previous errors
    setLoginError('');
    
    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await login(email, password);
      toast({
        title: "Login successful",
        description: "Welcome back!",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      console.log('Login successful:', data);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      
      // Set specific error message based on the error response
      if (error.message && error.message.toLowerCase().includes('email')) {
        setEmailError('This email is not registered');
      } else if (error.message && error.message.toLowerCase().includes('password')) {
        setPasswordError('Incorrect password');
      } else {
        setLoginError(error.message || "Invalid email or password");
      }
      
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, gray.50, blue.50)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Card
        bg="white"
        shadow="lg"
        borderRadius="xl"
        maxW="md"
        w="full"
        overflow="hidden"
      >
        <CardBody p={8}>
          <VStack spacing={8} align="stretch">
            <Box textAlign="center">
              <Heading
                as="h1"
                size="xl"
                mb={2}
                bgGradient="linear(to-r, blue.600, blue.800)"
                bgClip="text"
                letterSpacing="tight"
                fontWeight="bold"
              >
                Welcome Back
              </Heading>
              <Text color="gray.500">
                Sign in to continue to Auto Heal
              </Text>
            </Box>

            {loginError && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {loginError}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isInvalid={!!emailError}>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="medium"
                    color="gray.700"
                  >
                    Email Address
                  </FormLabel>
                  <Box position="relative">
                    <Icon
                      as={FiMail}
                      position="absolute"
                      left={4}
                      top="50%"
                      transform="translateY(-50%)"
                      color="blue.500"
                      zIndex={2}
                    />
                    <Input
                      type="email"
                      pl={12}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) validateEmail(e.target.value);
                      }}
                      placeholder="Enter your email"
                      size="lg"
                      bg="white"
                      border="2px solid"
                      borderColor={emailError ? "red.300" : "gray.200"}
                      _hover={{ borderColor: emailError ? "red.400" : "blue.400" }}
                      _focus={{
                        borderColor: emailError ? "red.500" : "blue.500",
                        boxShadow: emailError ? "0 0 0 1px #E53E3E" : "0 0 0 1px #3182ce"
                      }}
                    />
                  </Box>
                  {emailError && <FormErrorMessage>{emailError}</FormErrorMessage>}
                </FormControl>

                <FormControl isInvalid={!!passwordError}>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="medium"
                    color="gray.700"
                  >
                    Password
                  </FormLabel>
                  <Box position="relative">
                    <Icon
                      as={FiLock}
                      position="absolute"
                      left={4}
                      top="50%"
                      transform="translateY(-50%)"
                      color="blue.500"
                      zIndex={2}
                    />
                    <Input
                      type="password"
                      pl={12}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) validatePassword(e.target.value);
                      }}
                      placeholder="Enter your password"
                      size="lg"
                      bg="white"
                      border="2px solid"
                      borderColor={passwordError ? "red.300" : "gray.200"}
                      _hover={{ borderColor: passwordError ? "red.400" : "blue.400" }}
                      _focus={{
                        borderColor: passwordError ? "red.500" : "blue.500",
                        boxShadow: passwordError ? "0 0 0 1px #E53E3E" : "0 0 0 1px #3182ce"
                      }}
                    />
                  </Box>
                  {passwordError && <FormErrorMessage>{passwordError}</FormErrorMessage>}
                </FormControl>

                <Button
                  type="submit"
                  width="full"
                  size="lg"
                  bgGradient="linear(to-r, blue.500, blue.600)"
                  color="white"
                  _hover={{
                    bgGradient: "linear(to-r, blue.600, blue.700)",
                    transform: "translateY(-2px)",
                    boxShadow: "lg"
                  }}
                  height="56px"
                  fontSize="md"
                  transition="all 0.2s"
                  isLoading={isLoading}
                  loadingText="Signing In"
                >
                  Sign In
                </Button>
              </VStack>
            </form>

            <Text
              textAlign="center"
              color="gray.600"
              fontSize="sm"
            >
              Don't have an account?{' '}
              <RouterLink to="/signup" style={{ textDecoration: 'none' }}>
                <Text
                  as="span"
                  color="blue.600"
                  _hover={{
                    color: 'blue.700'
                  }}
                  fontWeight="medium"
                >
                  Create Account
                </Text>
              </RouterLink>
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Login;
