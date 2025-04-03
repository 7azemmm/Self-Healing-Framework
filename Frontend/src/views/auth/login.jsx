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
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { login } from '../../services/auth/authService';
import { FiMail, FiLock } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      console.log('Login successful:', data);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
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

            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl>
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
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      size="lg"
                      bg="white"
                      border="2px solid"
                      borderColor="gray.200"
                      _hover={{ borderColor: "blue.400" }}
                      _focus={{
                        borderColor: "blue.500",
                        boxShadow: "0 0 0 1px #3182ce"
                      }}
                    />
                  </Box>
                </FormControl>

                <FormControl>
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
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      size="lg"
                      bg="white"
                      border="2px solid"
                      borderColor="gray.200"
                      _hover={{ borderColor: "blue.400" }}
                      _focus={{
                        borderColor: "blue.500",
                        boxShadow: "0 0 0 1px #3182ce"
                      }}
                    />
                  </Box>
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