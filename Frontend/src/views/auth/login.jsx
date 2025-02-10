import React, { useState } from 'react';
import { Box, FormControl, FormLabel, Input, Button, Heading, Text, Link } from '@chakra-ui/react';
import { login } from '../../services/auth/authService';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      console.log('Login successful:', data);
      navigate('/dashboard'); // Redirect to the Dashboard page
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <Box bg="white" p={8} borderRadius="lg" boxShadow="lg" width="100%" maxWidth="600px" margin="auto" mt={8}>
      <Heading as="h2" size="xl" mb={6} textAlign="center" color="primary.500">
        Login
      </Heading>
      <form onSubmit={handleSubmit}>
        <FormControl id="email" mb={4}>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            placeholder="Enter your email"
            size="lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormControl>
        <FormControl id="password" mb={6}>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            placeholder="Enter your password"
            size="lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormControl>
        <Button type="submit" colorScheme="primary" width="100%" size="lg" mb={4}>
          Login
        </Button>
      </form>
      <Text textAlign="center" mt={4}>
        Don't have an account?{' '}
        <Link href="/signup" color="primary.500" fontWeight="bold">
          Sign Up
        </Link>
      </Text>
    </Box>
  );
};

export default Login;