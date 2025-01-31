import { Box, VStack, Text, Icon, Link } from "@chakra-ui/react";
import { FiMenu, FiSettings, FiBook, FiPlay, FiLogOut } from "react-icons/fi";

const Sidebar = () => {
  return (
    <Box
      w="20%"
      bg="blue.50"
      minH="100vh"
      px={4}
      py={6}
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      {/* Logo */}
      <Text fontSize="2xl" fontWeight="bold" mb={6} textAlign="center" color="blue.700">
        Testium
      </Text>

      {/* Menu */}
      <VStack align="stretch" spacing={4}>
        <SidebarItem icon={FiMenu} label="Dashboard" />
        <SidebarItem icon={FiBook} label="Documents" />
        <SidebarSection label="Execution">
          <SidebarItem icon={FiPlay} label="Execute" />
          <SidebarItem icon={FiPlay} label="Test Specific Scenario" />
        </SidebarSection>
        <SidebarSection label="Help">
          <SidebarItem icon={FiSettings} label="Settings" />
          <SidebarItem icon={FiBook} label="Documentation" />
        </SidebarSection>
      </VStack>

      {/* Logout */}
      <SidebarItem icon={FiLogOut} label="Log Out" color="red.500" />
    </Box>
  );
};

// eslint-disable-next-line react/prop-types
const SidebarItem = ({ icon, label, color }) => (
  <Link
    display="flex"
    alignItems="center"
    p={2}
    borderRadius="md"
    _hover={{ bg: "blue.100" }}
    bg="white"
  >
    <Icon as={icon} boxSize={5} color={color || "blue.500"} />
    <Text ml={3} fontSize="md" fontWeight="medium" color={color || "gray.800"}>
      {label}
    </Text>
  </Link>
);

// eslint-disable-next-line react/prop-types
const SidebarSection = ({ label, children }) => (
  <Box mt={6}>
    <Text fontSize="sm" fontWeight="bold" color="gray.500" mb={2}>
      {label}
    </Text>
    {children}
  </Box>
);

export default Sidebar;
