import { Flex, Text, Avatar, IconButton } from "@chakra-ui/react";
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
        <IconButton
          icon={<FiSettings />}
          variant="ghost"
          aria-label="Settings"
          mr={4}
        />
        <Avatar size="sm" name="MIU" />
      </Flex>
    </Flex>
  );
};

export default Navbar;
