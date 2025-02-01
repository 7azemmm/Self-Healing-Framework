import React, { useState } from 'react';
import { Box, FormControl, FormLabel, Input, Button, Heading, Text, Link } from '@chakra-ui/react';
import { signup } from '../../services/auth/authService';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await signup(fullName, email, password);
      console.log('Signup successful:', data);
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  return (
    <Box bg="white" p={8} borderRadius="lg" boxShadow="lg" width="100%" maxWidth="600px" margin="auto" mt={8}>
      <Heading as="h2" size="xl" mb={6} textAlign="center" color="primary.500">
        Sign Up
      </Heading>
      <form onSubmit={handleSubmit}>
        <FormControl id="fullName" mb={4}>
          <FormLabel>Full Name</FormLabel>
          <Input type="text" placeholder="Enter your full name" size="lg" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </FormControl>
        <FormControl id="email" mb={4}>
          <FormLabel>Email</FormLabel>
          <Input type="email" placeholder="Enter your email" size="lg" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormControl>
        <FormControl id="password" mb={6}>
          <FormLabel>Password</FormLabel>
          <Input type="password" placeholder="Enter your password" size="lg" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormControl>
        <Button type="submit" colorScheme="primary" width="100%" size="lg" mb={4}>
          Sign Up
        </Button>
      </form>
      <Text textAlign="center" mt={4}>
        Already have an account?{' '}
        <Link href="/login" color="primary.500" fontWeight="bold">
          Login
        </Link>
      </Text>
    </Box>
  );
};

export default Signup;
