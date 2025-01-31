import { Box, Text, Flex, Table, Thead, Tbody, Tr, Th, Td, Button } from "@chakra-ui/react";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";

const Documents = () => {
  // Static data for documents
  const documents = [
    { name: "Requirements Document", type: "PDF", date: "01 Dec 2023" },
    { name: "Test Plan", type: "DOCX", date: "05 Dec 2023" },
    { name: "Execution Report", type: "XLSX", date: "10 Dec 2023" },
  ];

  return (
    <Flex h="100vh" overflow="hidden">
      <Sidebar />
      <Box flex="1" bg="gray.50" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" px={6} py={4} overflowY="auto">
          {/* Header */}
          <Text fontSize="2xl" fontWeight="bold" mb={4}>
            Documents
          </Text>

          {/* Documents Table */}
          <Box bg="white" p={4} borderRadius="md" shadow="sm">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Type</Th>
                  <Th>Date</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {documents.map((doc, index) => (
                  <Tr key={index}>
                    <Td>{doc.name}</Td>
                    <Td>{doc.type}</Td>
                    <Td>{doc.date}</Td>
                    <Td>
                      <Button size="sm" colorScheme="blue">
                        Download
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Box>
      </Box>
    </Flex>
  );
};

export default Documents;
