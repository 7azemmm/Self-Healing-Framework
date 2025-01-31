import React from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Heading,
  Text,
  Link,
} from '@chakra-ui/react';

const Signup = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Signup submitted');
  };

  return (
    <Box
      bg="white"
      p={8}
      borderRadius="lg"
      boxShadow="lg"
      width="100%"
      maxWidth="600px"
      margin="auto"
      mt={8}
    >
      <Heading as="h2" size="xl" mb={6} textAlign="center" color="primary.500"> {/* Use theme color */}
        Sign Up
      </Heading>
      <form onSubmit={handleSubmit}>
        <FormControl id="fullName" mb={4}>
          <FormLabel>Full Name</FormLabel>
          <Input type="text" placeholder="Enter your full name" size="lg" />
        </FormControl>
        <FormControl id="email" mb={4}>
          <FormLabel>Email</FormLabel>
          <Input type="email" placeholder="Enter your email" size="lg" />
        </FormControl>
        <FormControl id="password" mb={6}>
          <FormLabel>Password</FormLabel>
          <Input type="password" placeholder="Enter your password" size="lg" />
        </FormControl>
        <Button
          type="submit"
          colorScheme="primary" 
          width="100%"
          size="lg"
          mb={4}
        >
          Sign Up
        </Button>
      </form>
      <Text textAlign="center" mt={4}>
        Already have an account?{' '}
        <Link href="/login" color="primary.500" fontWeight="bold"> {/* Use theme color */}
          Login
        </Link>
      </Text>
    </Box>
  );
};

export default Signup;