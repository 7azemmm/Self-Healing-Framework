import React, { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Heading,
  Text,
  Card,
  CardBody,
  VStack,
  Icon,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { signup } from '../../services/auth/authService';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await signup(fullName, email, password);
      console.log('Signup successful:', data);
      navigate('/login');
    } catch (error) {
      console.error('Signup failed:', error);
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
                Create Account
              </Heading>
              <Text color="gray.500">
                Sign up to get started with Auto Heal
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
                    Full Name
                  </FormLabel>
                  <Box position="relative">
                    <Icon
                      as={FiUser}
                      position="absolute"
                      left={4}
                      top="50%"
                      transform="translateY(-50%)"
                      color="blue.500"
                      zIndex={2}
                    />
                    <Input
                      type="text"
                      pl={12}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
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
                  Create Account
                </Button>
              </VStack>
            </form>

            <Text
              textAlign="center"
              color="gray.600"
              fontSize="sm"
            >
              Already have an account?{' '}
              <RouterLink to="/login" style={{ textDecoration: 'none' }}>
                <Text
                  as="span"
                  color="blue.600"
                  _hover={{
                    color: 'blue.700'
                  }}
                  fontWeight="medium"
                >
                  Sign In
                </Text>
              </RouterLink>
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Signup;