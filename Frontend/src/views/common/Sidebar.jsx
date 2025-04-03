import { Box, VStack, Text, Icon, Link, Divider, Tooltip } from "@chakra-ui/react";
import {
  FiGrid,
  FiFolder,
  FiPlay,
  FiSettings,
  FiHelpCircle,
  FiLogOut,
  FiPlusCircle,
  FiBookOpen
} from "react-icons/fi";
import LogoImage from "../../assets/images/brand-logo-new.png"

const Sidebar = () => {
  return (
    <Box
      w={{ base: "60px", md: "240px" }}
      bgGradient="linear(to-b, blue.600, blue.700)"
      minH="100vh"
      py={6}
      display="flex"
      flexDirection="column"
      position="fixed"
      zIndex={5}
      boxShadow="lg"
    >
      {/* Logo/Brand */}
      <Box px={4} mb={8}>
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

      <VStack spacing={1} align="stretch" flex={1}>
        {/* Main Navigation */}
        <NavSection>
          <NavItem
            icon={FiGrid}
            label="Dashboard"
            href="/dashboard"
          />
          <NavItem
            icon={FiFolder}
            label="Documents"
            href="/documents"
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
          <NavItem
            icon={FiPlusCircle}
            label="New Scenario"
            href="/add-scenario"
          />
        </NavSection>

        <Divider my={4} borderColor="whiteAlpha.200" />

        {/* Projects Section */}
        <NavSection label="Projects">
          <NavItem
            icon={FiPlusCircle}
            label="Create Project"
            href="/create-project"
          />
        </NavSection>

        <Divider my={4} borderColor="whiteAlpha.200" />

        {/* Help Section */}
        <NavSection label="Help & Support">
          <NavItem
            icon={FiSettings}
            label="Settings"
            href="/settings"
          />
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

      {/* Logout Section */}
      <Box mt={6} px={4}>
        <Divider mb={4} borderColor="whiteAlpha.200" />
        <NavItem
          icon={FiLogOut}
          label="Log Out"
          href="/logout"
          color="red.300"
        />
      </Box>
    </Box>
  );
};

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