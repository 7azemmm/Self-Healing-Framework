import { Flex, Text, Avatar, IconButton, Link, Box, Menu, MenuButton, MenuList, MenuItem, Spinner } from "@chakra-ui/react";
import { FiSettings, FiLogOut, FiUser } from "react-icons/fi";
import { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { getUserData, logout } from "../../services/auth/authService.js"; // Adjust the path as needed

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const userData = await getUserData();
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(null); // Handle error (e.g., user not logged in)
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
  };

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

        {loading ? (
          <Spinner size="sm" color="white" />
        ) : user ? (
          <Menu>
            <MenuButton
              as={Box}
              transition="transform 0.2s"
              _hover={{ transform: "translateY(-2px)" }}
            >
              <Avatar
                size="sm"
                name={user.full_name || "User"}
                bg="whiteAlpha.300"
                color="white"
                cursor="pointer"
                _hover={{
                  bg: "whiteAlpha.400"
                }}
              />
            </MenuButton>
            <MenuList>
              <MenuItem isDisabled>
                <Text fontSize="sm" color="gray.600">
                  Signed in as {user.full_name || "User"}
                </Text>
              </MenuItem>
              <MenuItem as={RouterLink} to="/profile" icon={<FiUser />}>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout} icon={<FiLogOut />}>
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Link href="/login">
            <Avatar
              size="sm"
              name="Login"
              bg="whiteAlpha.300"
              color="white"
              cursor="pointer"
              _hover={{
                bg: "whiteAlpha.400"
              }}
            />
          </Link>
        )}
      </Flex>
    </Flex>
  );
};

export default Navbar;
