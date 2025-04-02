import React, { useState } from 'react';
import { Box, FormControl, FormLabel, Input, Button, Heading, Text, Link } from '@chakra-ui/react';
import { signup } from '../../services/auth/authService'; // Adjust the import path as needed
import { useNavigate } from 'react-router-dom';

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
    <>
      {/* Inline CSS for Advanced Styling and Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-30px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes pulseGlow {
            0% {
              box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
            }
            50% {
              box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
            }
            100% {
              box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
            }
          }

          .fade-in {
            animation: fadeIn 0.7s ease-out;
          }

          .glass-container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          }

          .glow-button {
            animation: pulseGlow 2s infinite;
          }

          .input-glow {
            transition: all 0.3s ease;
          }

          .input-glow:focus {
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
            transform: scale(1.02);
          }

          .gradient-text {
            background: linear-gradient(90deg, #ffffff, #e0e0e0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        `}
      </style>

      {/* Main Component */}
      <Box
        minH="100vh"
        bgGradient="linear(to-br, blue.900, teal.700)" // Same gradient as Login
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
        position="relative"
        overflow="hidden"
      >
        {/* Decorative Background Elements */}
        <Box
          position="absolute"
          top="-50px"
          left="-50px"
          width="200px"
          height="200px"
          bg="rgba(255, 255, 255, 0.1)"
          borderRadius="50%"
          zIndex={0}
        />
        <Box
          position="absolute"
          bottom="-100px"
          right="-100px"
          width="300px"
          height="300px"
          bg="rgba(255, 255, 255, 0.15)"
          borderRadius="50%"
          zIndex={0}
        />

        {/* Signup Form Container */}
        <Box
          className="fade-in glass-container" // Apply fade-in and glassmorphism
          p={{ base: 6, md: 10 }}
          borderRadius="2xl"
          width={{ base: '90%', md: '100%' }}
          maxWidth={{ base: '400px', md: '600px' }}
          zIndex={1}
        >
          <Heading
            as="h2"
            size="2xl"
            mb={8}
            textAlign="center"
            className="gradient-text" // Gradient text effect
            fontFamily="Poppins, sans-serif"
            fontWeight="extrabold"
          >
            Create Account
          </Heading>
          <form onSubmit={handleSubmit}>
            <FormControl id="fullName" mb={6}>
              <FormLabel color="white" fontWeight="medium" fontSize="lg">
                Full Name
              </FormLabel>
              <Input
                type="text"
                placeholder="Enter your full name"
                size="lg"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-glow" // Glow effect on focus
                _focus={{ borderColor: 'white' }}
                bg="rgba(255, 255, 255, 0.9)"
                color="black"
                border="1px solid rgba(255, 255, 255, 0.3)"
                borderRadius="md"
              />
            </FormControl>
            <FormControl id="email" mb={6}>
              <FormLabel color="white" fontWeight="medium" fontSize="lg">
                Email
              </FormLabel>
              <Input
                type="email"
                placeholder="Enter your email"
                size="lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-glow" // Glow effect on focus
                _focus={{ borderColor: 'white' }}
                bg="rgba(255, 255, 255, 0.9)"
                color="black"
                border="1px solid rgba(255, 255, 255, 0.3)"
                borderRadius="md"
              />
            </FormControl>
            <FormControl id="password" mb={8}>
              <FormLabel color="white" fontWeight="medium" fontSize="lg">
                Password
              </FormLabel>
              <Input
                type="password"
                placeholder="Enter your password"
                size="lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-glow" // Glow effect on focus
                _focus={{ borderColor: 'white' }}
                bg="rgba(255, 255, 255, 0.9)"
                color="black"
                border="1px solid rgba(255, 255, 255, 0.3)"
                borderRadius="md"
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme="blue" // Same button color as Login
              width="100%"
              size="lg"
              mb={6}
              className="glow-button" // Pulsing glow effect
              _hover={{ bg: 'blue.600', transform: 'scale(1.05)' }}
              transition="all 0.3s ease"
              fontWeight="bold"
              borderRadius="md"
            >
              Sign Up
            </Button>
          </form>
          <Text textAlign="center" mt={4} color="white" fontSize="md">
            Already have an account?{' '}
            <Link
              href="/login"
              color="white"
              fontWeight="bold"
              _hover={{ color: 'blue.200', textDecoration: 'underline' }} // Match hover color
              transition="color 0.2s ease"
            >
              Login
            </Link>
          </Text>
        </Box>
      </Box>
    </>
  );
};

export default Signup;