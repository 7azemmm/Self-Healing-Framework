import { Flex, Text, Avatar, IconButton,Link } from "@chakra-ui/react";
import { FiSettings } from "react-icons/fi";


const Navbar = () => {
  return (
    <Flex
      as="header"
      bg="white"
      h="60px"
      align="center"
      justify="space-between"
      px={6}
      borderBottom="1px solid"
      borderColor="gray.200"
    >
      <Text fontSize="lg" fontWeight="bold" color="blue.700">
        Dashboard
      </Text>
      <Flex align="center">
        <Link  href="/settings">
        <IconButton
          icon={<FiSettings />}
          variant="ghost"
          aria-label="Settings"
          mr={4}
          
        />
        </Link>
        <Avatar size="sm" name="Profile" />
      </Flex>
    </Flex>
  );
};

export default Navbar;
