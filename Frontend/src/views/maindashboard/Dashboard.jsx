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
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import PropTypes from 'prop-types'; // Added for prop-types validation

const Dashboard = () => {
  // State for dynamic data
  const [totalScenarios, setTotalScenarios] = useState(0);
  const [totalHealedElements, setTotalHealedElements] = useState(0);
  const [executionData, setExecutionData] = useState([]);
  const [healedElements, setHealedElements] = useState([]);
  const [projects, setProjects] = useState([]); // State for list of projects
  const [selectedProjectId, setSelectedProjectId] = useState(''); // State for selected project

  // Fetch projects from backend when component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/get_projects/');
        setProjects(response.data);
        if (response.data.length > 0) {
          setSelectedProjectId(response.data[0].project_id); // Default to first project
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  // Fetch metrics from backend when selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId) {
      axios.get(`/metrics/${selectedProjectId}/`)
        .then(response => {
          const data = response.data;

          // Calculate totals for stat cards
          const totalScen = data.reduce((sum, metric) => sum + metric.number_of_scenarios, 0);
          const totalHealed = data.reduce((sum, metric) => sum + metric.number_of_healed_elements, 0);
          setTotalScenarios(totalScen);
          setTotalHealedElements(totalHealed);

          // Prepare data for bar chart (executions with healed elements count)
          const execData = data.map((metric, index) => ({
            name: `Execution ${index + 1}`,
            count: metric.number_of_healed_elements
          }));
          setExecutionData(execData);

          // Flatten healed elements for the table
          const healedElems = data.flatMap((metric, index) => 
            (metric.healed_elements || []).map(elem => ({
              name: `Execution ${index + 1}`,
              type: 'unknown', // Type not available; adjust if backend provides it
              date: new Date(elem.created_at).toLocaleDateString(),
              pastId: elem.past_element_attribute,
              newId: elem.new_element_attribute
            }))
          );
          setHealedElements(healedElems);
        })
        .catch(error => {
          console.error('Error fetching metrics:', error);
          // Reset data on error
          setTotalScenarios(0);
          setTotalHealedElements(0);
          setExecutionData([]);
          setHealedElements([]);
        });
    }
  }, [selectedProjectId]);

  // Handle project selection change
  const handleProjectChange = (event) => {
    setSelectedProjectId(event.target.value);
  };

  return (
    <Flex h="100vh" overflow="hidden">
      <Sidebar />
      <Box flex="1" bg="gray.50" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" px={6} py={4} overflowY="auto" display="flex" flexDirection="column">
          {/* Project Selection Dropdown */}
          <Box mb={6}>
            <Text fontWeight="bold" mb={2}>Select Project</Text>
            <Select 
              value={selectedProjectId} 
              onChange={handleProjectChange} 
              placeholder="Choose a project"
            >
              {projects.map(project => (
                <option key={project.project_id} value={project.project_id}>
                  {project.project_name}
                </option>
              ))}
            </Select>
          </Box>

          {/* Stat Cards */}
          <Flex gap={6} justify="space-evenly" mb={8}>
            <StatCard title="Scenarios" value={totalScenarios.toString()} />
            <StatCard 
              title="Healed Elements" 
              value={`${Math.round((totalHealedElements / (totalScenarios || 1)) * 100)}%`} 
              progress={Math.round((totalHealedElements / (totalScenarios || 1)) * 100)} 
            />
          </Flex>

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

// Define propTypes for Dashboard (even though not used now, kept for consistency)
Dashboard.propTypes = {
  projectId: PropTypes.string,
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