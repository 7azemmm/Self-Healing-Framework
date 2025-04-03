import { Flex, Text, Avatar, IconButton, Link, Box } from "@chakra-ui/react";
import { FiSettings } from "react-icons/fi";

const Navbar = () => {
  return (
    <Flex
      as="header"
      className="navbar-slide"
      bgGradient="linear(to-r, blue.600, blue.700)"
      h="64px"
      align="center"
      justify="space-between"
      px={8}
      borderBottom="1px solid"
      borderColor="whiteAlpha.200"
      position="sticky"
      top={0}
      zIndex={10}
      boxShadow="lg"
    >
      <Text
        fontSize="lg"
        fontWeight="semibold"
        color="white"
        letterSpacing="tight"
      >
        {/* You can add the current page title or leave it empty */}
      </Text>

      <Flex align="center" gap={4}>
        <Link href="/settings">
          <IconButton
            icon={<FiSettings />}
            variant="ghost"
            aria-label="Settings"
            color="white"
            _hover={{
              bg: 'whiteAlpha.200',
              transform: 'rotate(90deg)'
            }}
            transition="all 0.2s"
          />
        </Link>
        <Box
          transition="transform 0.2s"
          _hover={{ transform: "translateY(-2px)" }}
        >
          <Avatar
            size="sm"
            name="Profile"
            bg="whiteAlpha.300"
            color="white"
            cursor="pointer"
            _hover={{
              bg: "whiteAlpha.400"
            }}
          />
        </Box>
      </Flex>
    </Flex>
  );
};

export default Navbar;