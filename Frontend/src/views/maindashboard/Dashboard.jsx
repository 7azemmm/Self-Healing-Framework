import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Text, 
  Flex, 
  Progress, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td,
  Select
} from "@chakra-ui/react";
import { ResponsiveContainer , BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// Assuming Sidebar and Navbar are defined elsewhere
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";

const Dashboard = () => {
  const [totalScenarios, setTotalScenarios] = useState(0);
  const [totalHealedElements, setTotalHealedElements] = useState(0);
  const [executionData, setExecutionData] = useState([]);
  const [healedElements, setHealedElements] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/get_projects/'); // Adjust URL as needed
        setProjects(response.data);
        if (response.data.length > 0) {
          setSelectedProjectId(response.data[0].project_id);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  // Fetch project metrics when project changes
  useEffect(() => {
    if (selectedProjectId) {
      const fetchProjectMetrics = async () => {
        try {
          const response = await axios.get(`/project_metrics/${selectedProjectId}/`);
          const data = response.data;
          setTotalScenarios(data.total_scenarios);
          setTotalHealedElements(data.total_healed_elements);
          setExecutionData(data.execution_data.map(exec => ({
            name: exec.execution_name,
            count: exec.number_of_healed_elements
          })));
          setHealedElements(data.healed_elements.map(elem => ({
            name: elem.execution_name,
            pastId: elem.past_id,
            newId: elem.new_id,
            date: new Date(elem.created_at).toLocaleDateString()
          })));
        } catch (error) {
          console.error('Error fetching project metrics:', error);
        }
      };
      fetchProjectMetrics();
    }
  }, [selectedProjectId]);

  const healedPercentage = totalScenarios > 0 ? Math.round((totalHealedElements / totalScenarios) * 100) : 0;

  return (
    <Flex h="100vh" overflow="hidden">
      <Sidebar />
      <Box flex="1" bg="gray.50" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" px={6} py={4} overflowY="auto">
          {/* Project Selection */}
          <Box mb={6}>
            <Text fontWeight="bold" mb={2}>Select Project</Text>
            <Select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              placeholder="Choose a project"
            >
              {projects.map(project => (
                <option key={project.project_id} value={project.project_id}>
                  {project.project_name}
                </option>
              ))}
            </Select>
          </Box>

          {/* Summary Statistics */}
          <Flex gap={6} mb={8}>
            <Box bg="white" p={4} borderRadius="md" shadow="sm" flex="1">
              <Text fontWeight="bold">Scenarios</Text>
              <Text fontSize="2xl" color="blue.500">{totalScenarios}</Text>
            </Box>
            <Box bg="white" p={4} borderRadius="md" shadow="sm" flex="1">
              <Text fontWeight="bold">Healed Elements</Text>
              <Text fontSize="2xl" color="blue.500">{healedPercentage}%</Text>
              <Progress value={healedPercentage} colorScheme="blue" size="sm" mt={2} />
            </Box>
          </Flex>

          {/* Test Execution Graph and Healed Elements Table */}
          <Flex gap={8} flexWrap="wrap">
            <Box flex="1" bg="white" p={4} borderRadius="md" shadow="sm" minW="300px">
              <Text fontWeight="bold" mb={4}>Test Execution</Text>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={executionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3182ce" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Box flex="1" bg="white" p={4} borderRadius="md" shadow="sm" minW="300px">
              <Text fontWeight="bold" mb={4}>Healed Elements</Text>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Execution Name</Th>
                    <Th>Past ID</Th>
                    <Th>New ID</Th>
                    <Th>Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {healedElements.map((element, index) => (
                    <Tr key={index}>
                      <Td>{element.name}</Td>
                      <Td>{element.pastId}</Td>
                      <Td>{element.newId}</Td>
                      <Td>{element.date}</Td>
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

export default Dashboard;