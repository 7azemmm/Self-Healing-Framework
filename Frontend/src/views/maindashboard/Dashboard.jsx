import { Box, SimpleGrid, Text, Flex, Progress, Table, Thead, Tbody, Tr, Th, Td } from "@chakra-ui/react";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
//import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

const Dashboard = () => {
  // Static data for healed elements
  const healedElements = [
    { name: "First Execution", type: "Button", date: "01 Dec 2023", pastId: "login-btn", newId: "login-btn" },
    { name: "Second Execution", type: "Input Field", date: "11 Dec 2024", pastId: "pass-input", newId: "PASSWORD" },
    { name: "Third Execution", type: "Input Field", date: "11 Dec 2024", pastId: "email-input", newId: "email-input" },
  ];

  // Sample data for the bar chart: executions and their counts
  const executionData = [
    { name: "Execution 1", count: 24 },
    { name: "Execution 2", count: 18 },
    { name: "Execution 3", count: 30 },
    { name: "Execution 4", count: 12 },
    { name: "Execution 5", count: 28 },
  ];

  return (
    <Flex h="100vh" overflow="hidden">
      <Sidebar />
      <Box flex="1" bg="gray.50" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" px={6} py={4} overflowY="auto" display="flex" flexDirection="column">
          {/* Stat Cards */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
            <StatCard title="Scenarios" value="25" />
            <StatCard title="Healed Elements" value="79%" progress={79} />
            <StatCard title="Coverage" value="52%" progress={52} />
          </SimpleGrid>

          {/* Main Content */}
          <Flex gap={8} flexWrap="wrap" flex="1">
            {/* Test Execution Chart with Bar Chart */}
            <Box flex="1" bg="white" p={4} borderRadius="md" shadow="sm" minW="300px">
              <Text fontWeight="bold" mb={4}>
                Test Execution
              </Text>
              <Box h="300px" borderRadius="md">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={executionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3182ce" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            {/* Healed Elements Table */}
            <Box flex="1" bg="white" p={4} borderRadius="md" shadow="sm" minW="300px">
              <Text fontWeight="bold" mb={4}>
                Healed Elements
              </Text>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Type</Th>
                    <Th>Date</Th>
                    <Th>Past ID</Th>
                    <Th>New ID</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {healedElements.map((element, index) => (
                    <Tr key={index}>
                      <Td>{element.name}</Td>
                      <Td>{element.type}</Td>
                      <Td>{element.date}</Td>
                      <Td>{element.pastId}</Td>
                      <Td>{element.newId}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Flex>
        </Box>
      </Box>
    </Flex>
  );
};

// eslint-disable-next-line react/prop-types
const StatCard = ({ title, value, progress }) => (
  <Box bg="white" p={6} borderRadius="md" shadow="sm" textAlign="center">
    <Text fontWeight="bold" mb={2}>
      {title}
    </Text>
    <Text fontSize="2xl" fontWeight="bold" color="blue.500">
      {value}
    </Text>
    {progress !== undefined && (
      <Progress value={progress} colorScheme="blue" size="sm" mt={2} />
    )}
  </Box>
);

export default Dashboard;
