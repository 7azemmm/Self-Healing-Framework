import { Flex, Text, Avatar, IconButton, Link } from "@chakra-ui/react";
import { FiSettings } from "react-icons/fi";

const Navbar = () => {
  return (
    <>
      {/* Inline CSS for Advanced Styling */}
      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes pulseGlow {
            0% {
              box-shadow: 0 0 5px rgba(0, 128, 255, 0.3);
            }
            50% {
              box-shadow: 0 0 15px rgba(0, 128, 255, 0.6);
            }
            100% {
              box-shadow: 0 0 5px rgba(0, 128, 255, 0.3);
            }
          }

          .navbar-slide {
            animation: slideDown 0.5s ease-out;
          }

          .avatar-glow {
            animation: pulseGlow 2s infinite;
            transition: transform 0.3s ease;
          }

          .avatar-glow:hover {
            transform: scale(1.1);
          }

          .settings-icon:hover {
            transform: rotate(90deg);
          }
        `}
      </style>

      {/* Main Component */}
      <Flex
        as="header"
        className="navbar-slide"
        bgGradient="linear(to-r, blue.900, teal.700)" // Match the color scheme
        h="70px" // Slightly taller for a premium feel
        align="center"
        justify="space-between"
        px={6}
        borderBottom="1px solid"
        borderColor="rgba(255, 255, 255, 0.2)"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Text
          fontSize="xl"
          fontWeight="extrabold"
          color="white"
          fontFamily="Poppins, sans-serif"
          bg="linear-gradient(90deg, #ffffff, #e0e0e0)"
          style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
        
        </Text>
        <Flex align="center">
          <Link href="/settings">
            <IconButton
              icon={<FiSettings />}
              variant="ghost"
              aria-label="Settings"
              mr={4}
              color="white"
              _hover={{ color: 'blue.200' }}
              className="settings-icon"
              transition="transform 0.3s ease"
            />
          </Link>
          <Avatar
            size="sm"
            name="Profile"
            className="avatar-glow"
            bg="blue.500"
            color="white"
          />
        </Flex>
      </Flex>
    </>
  );
};

export default Navbar;