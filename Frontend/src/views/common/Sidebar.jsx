import { Box, VStack, Text, Icon, Link, Divider, Tooltip, useToast } from "@chakra-ui/react";
import {
  FiGrid,
  FiFolder,
  FiPlay,
  FiHelpCircle,
  FiLogOut,
  FiPlusCircle,
  FiBookOpen,
  FiList,
  FiSettings,
  FiLayers,
  FiEdit
} from "react-icons/fi";
import LogoImage from "../../assets/images/testing.png"
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
      status: "success",
      duration: 3000,
      isClosable: true,
      position: "top",
    });
    navigate('/');
  };

  return (
    <Box
      w={{ base: "62px", md: "242px" }}
      bgGradient="linear(to-b, blue.600, blue.700)"
      h="100vh"
      position="fixed"
      zIndex={5}
      boxShadow="lg"
      display="flex"
      flexDirection="column"
    >
      {/* Logo/Brand */}
      <Box px={4} py={6} flexShrink={0}>
        <Box display="flex" alignItems="center" gap={3}>
          <Box
            width={{ base: '32px', md: '45px' }}
            height={{ base: '32px', md: '45px' }}
          >
            <img
              src={LogoImage}
              alt="Auto Heal Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </Box>
          {/* <Box
            width={{ base: '32px', md: '45px' }}
            height={{ base: '32px', md: '45px' }}
          >
            <img
              src="https://www.miuegypt.edu.eg/wp-content/uploads/logo-miu.png"
              alt="Auto Heal Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </Box> */}
          <Text
            fontSize={{ base: "l", md: "xl" }}
            fontWeight="bold"
            color="white"
            display={{ base: "none", md: "block" }}
            letterSpacing="tight"
          >
            Auto Heal
          </Text>
        </Box>
      </Box>

      {/* Scrollable Navigation Section */}
      <Box 
        flex="1" 
        overflowY="auto" 
        overflowX="hidden"
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
            background: 'rgba(255, 255, 255, 0.1)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
          },
        }}
      >
        <VStack spacing={1} align="stretch" px={4}>
          {/* Main Navigation */}
          <NavSection>
            <NavItem
              icon={FiGrid}
              label="Dashboard"
              href="/dashboard"
            />
          </NavSection>
          <Divider my={4} borderColor="whiteAlpha.200" />
          <NavSection label="Mapping and new Scenario">
            <NavItem
              icon={FiFolder}
              label="Documents"
              href="/documents"
            />
            <NavItem
              icon={FiPlusCircle}
              label="New Scenario"
              href="/add-scenario"
            />
          </NavSection>

          <Divider my={4} borderColor="whiteAlpha.200" />

          {/* Execution Section */}
          <NavSection label="Execution">
            <NavItem
              icon={FiPlay}
              label="Execute Tests"
              href="/execute"
            />
          </NavSection>

          <Divider my={4} borderColor="whiteAlpha.200" />

          {/* Projects Section */}
          <NavSection label="Projects">
            <NavItem
              icon={FiSettings}
              label="Create Project"
              href="/create-project"
            />
          </NavSection>

          <Divider my={4} borderColor="whiteAlpha.200" />

          {/* Sequence and Steps Section */}
          <NavSection label="Sequence and Steps">
            <NavItem
              icon={FiList}
              label="Update Order"
              href="/update-order"
            />
            <NavItem
              icon={FiLayers}
              label="Create Execution Sequence"
              href="/create-seq"
            />
            <NavItem
              icon={FiEdit}
              label="Update Mapping"
              href="/update-mapping"
            />
          </NavSection>

          <Divider my={4} borderColor="whiteAlpha.200" />

          {/* Help Section */}
          <NavSection label="Help & Support">
            <NavItem
              icon={FiBookOpen}
              label="Documentation"
              href="/documentation"
            />
            <NavItem
              icon={FiHelpCircle}
              label="Support"
              href="/support"
            />
          </NavSection>
        </VStack>
      </Box>

      {/* Fixed Logout Section */}
      <Box px={4} py={6} flexShrink={0}>
        <Divider mb={4} borderColor="whiteAlpha.200" />
        <Box
          onClick={handleLogout}
          display="flex"
          alignItems="center"
          px={4}
          py={2}
          mx={2}
          borderRadius="md"
          cursor="pointer"
          color="red.300"
          transition="all 0.2s"
          _hover={{
            bg: 'whiteAlpha.200',
            transform: 'translateX(2px)',
          }}
          role="group"
        >
          <Icon
            as={FiLogOut}
            boxSize={5}
            color="red.300"
            _groupHover={{ color: 'white' }}
          />
          <Text
            ml={3}
            fontSize="sm"
            fontWeight="medium"
            display={{ base: "none", md: "block" }}
            _groupHover={{ color: 'white' }}
          >
            Log Out
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

// eslint-disable-next-line react/prop-types
const NavSection = ({ label, children }) => (
  <Box>
    {label && (
      <Text
        px={4}
        fontSize="xs"
        fontWeight="medium"
        color="whiteAlpha.600"
        textTransform="uppercase"
        letterSpacing="wider"
        mb={2}
        display={{ base: "none", md: "block" }}
      >
        {label}
      </Text>
    )}
    <VStack spacing={1} align="stretch">
      {children}
    </VStack>
  </Box>
);

// eslint-disable-next-line react/prop-types
const NavItem = ({ icon, label, href, color = "white" }) => (
  <Tooltip
    label={label}
    placement="right"
    display={{ base: "block", md: "none" }}
    bg="blue.800"
    color="white"
  >
    <Link
      href={href}
      style={{ textDecoration: 'none' }}
      _focus={{ outline: 'none' }}
    >
      <Box
        display="flex"
        alignItems="center"
        px={4}
        py={2}
        mx={2}
        borderRadius="md"
        cursor="pointer"
        color={color}
        transition="all 0.2s"
        _hover={{
          bg: 'whiteAlpha.200',
          transform: 'translateX(2px)',
        }}
        role="group"
      >
        <Icon
          as={icon}
          boxSize={5}
          color={color}
          _groupHover={{ color: 'white' }}
        />
        <Text
          ml={3}
          fontSize="sm"
          fontWeight="medium"
          display={{ base: "none", md: "block" }}
          _groupHover={{ color: 'white' }}
        >
          {label}
        </Text>
      </Box>
    </Link>
  </Tooltip>
);

export default Sidebar;
