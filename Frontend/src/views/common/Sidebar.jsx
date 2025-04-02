import { Box, VStack, Text, Icon, Link } from "@chakra-ui/react";
import { FiMenu, FiSettings, FiBook, FiPlay, FiLogOut, FiPlus } from "react-icons/fi";

const Sidebar = () => {
  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
          }

          @keyframes iconHover {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }

          .sidebar-slide { animation: slideIn 0.7s ease-out; }
          .sidebar-item { transition: all 0.3s ease; }
          .sidebar-item:hover { transform: translateX(5px); }
          .sidebar-item:hover .sidebar-icon { animation: iconHover 0.5s ease; }
          .gradient-text {
            background: linear-gradient(90deg, #ffffff, #e0e0e0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        `}
      </style>

      <Box
        w={{ base: "60px", md: "20%" }}
        bgGradient="linear(to-b, blue.900, teal.700)"
        minH="100vh"
        px={{ base: 2, md: 4 }}
        py={6}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        className="sidebar-slide"
        position="fixed"
        zIndex={5}
      >
        <Text
          fontSize={{ base: "lg", md: "2xl" }}
          fontWeight="extrabold"
          mb={6}
          textAlign="center"
          className="gradient-text"
          fontFamily="Poppins, sans-serif"
        >
          ReqTest
        </Text>

        <VStack align="stretch" spacing={4}>
          <SidebarItem icon={FiMenu} label="Dashboard" href="/dashboard" />
          <SidebarItem icon={FiBook} label="Documents" href="/documents" />
          <SidebarSection label="Execution">
            <SidebarItem icon={FiPlay} label="Execute" href="/execute" />
            <SidebarItem icon={FiPlay} label="Add a new Scenario" href="/add-scenario" />
          </SidebarSection>
          <SidebarSection label="Projects">
            <SidebarItem icon={FiPlus} label="Create Project" href="/create-project" />
          </SidebarSection>
          <SidebarSection label="Help">
            <SidebarItem icon={FiSettings} label="Settings" href="/settings" />
            <SidebarItem icon={FiBook} label="Documentation" href="/documentation" />
          </SidebarSection>
        </VStack>

        <SidebarItem icon={FiLogOut} label="Log Out" href="/logout" color="red.500" />
      </Box>
    </>
  );
};

const SidebarItem = ({ icon, label, href, color }) => (
  <Link
    href={href}
    display="flex"
    alignItems="center"
    p={3}
    borderRadius="md"
    _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
    bg="transparent"
    className="sidebar-item"
  >
    <Icon as={icon} boxSize={5} color={color || "white"} className="sidebar-icon" />
    <Text
      ml={3}
      fontSize="md"
      fontWeight="medium"
      color={color || "white"}
      display={{ base: "none", md: "block" }}
    >
      {label}
    </Text>
  </Link>
);

const SidebarSection = ({ label, children }) => (
  <Box mt={6}>
    <Text
      fontSize="sm"
      fontWeight="bold"
      color="rgba(255, 255, 255, 0.6)"
      mb={2}
      display={{ base: "none", md: "block" }}
    >
      {label}
    </Text>
    {children}
  </Box>
);

export default Sidebar;