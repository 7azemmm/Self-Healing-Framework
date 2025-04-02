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
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

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
    <>
      {/* Inline CSS for Advanced Styling and Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes pulseGlow {
            0% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.3); }
            50% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.6); }
            100% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.3); }
          }

          .fade-in {
            animation: fadeIn 0.7s ease-out;
          }

          .glass-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s ease;
          }

          .glass-card:hover {
            transform: translateY(-5px);
          }

          .select-glow {
            transition: all 0.3s ease;
          }

          .select-glow:focus {
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
            transform: scale(1.02);
          }

          .progress-glow {
            animation: pulseGlow 2s infinite;
          }

          .gradient-text {
            background: linear-gradient(90deg, #ffffff, #e0e0e0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .table-row:hover {
            background: rgba(255, 255, 255, 0.05);
            transform: scale(1.01);
            transition: all 0.2s ease;
          }
        `}
      </style>

      <Flex h="100vh" overflow="hidden">
        <Sidebar />
        <Box
          ml={{ base: "60px", md: "20%" }} // Matches Sidebar width
          flex="1"
          bgGradient="linear(to-br, blue.900, teal.700)" // Consistent with Sidebar/Navbar
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          <Navbar />
          <Box flex="1" px={6} py={4} overflowY="auto">
            {/* Dashboard Title */}
            <Text
              fontSize="2xl"
              fontWeight="bold"
              mb={6}
              color="white"
              fontFamily="Poppins, sans-serif"
              className="gradient-text"
            >
              Project Dashboard
            </Text>

            {/* Project Selection */}
            <Box mb={6} className="fade-in">
              <Text
                fontWeight="bold"
                mb={2}
                fontSize="lg"
                color="white"
                fontFamily="Poppins, sans-serif"
              >
                Select Project
              </Text>
              <Select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                placeholder="Choose a project"
                className="select-glow"
                bg="rgba(255, 255, 255, 0.9)"
                color="black"
                border="1px solid rgba(255, 255, 255, 0.3)"
                borderRadius="md"
                _focus={{ borderColor: 'white' }}
              >
                {projects.map(project => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.project_name}
                  </option>
                ))}
              </Select>
            </Box>

            {/* Summary Statistics */}
            <Flex gap={6} mb={8} flexWrap="wrap">
              <Box
                className="glass-card fade-in"
                p={4}
                borderRadius="lg"
                flex="1"
                minW="200px"
              >
                <Text
                  fontWeight="bold"
                  fontSize="lg"
                  color="white"
                  fontFamily="Poppins, sans-serif"
                >
                  Scenarios
                </Text>
                <Text fontSize="3xl" className="gradient-text" mt={2}>
                  {totalScenarios}
                </Text>
              </Box>
              <Box
                className="glass-card fade-in"
                p={4}
                borderRadius="lg"
                flex="1"
                minW="200px"
              >
                <Text
                  fontWeight="bold"
                  fontSize="lg"
                  color="white"
                  fontFamily="Poppins, sans-serif"
                >
                  Healed Elements
                </Text>
                <Text fontSize="3xl" className="gradient-text" mt={2}>
                  {healedPercentage}%
                </Text>
                <Progress
                  value={healedPercentage}
                  size="md"
                  mt={2}
                  css={{
                    '& > div': {
                      background: 'linear-gradient(to right, #3182ce, #63b3ed)',
                    },
                  }}
                  className="progress-glow"
                  borderRadius="md"
                />
              </Box>
            </Flex>

            {/* Test Execution Graph and Healed Elements Table */}
            <Flex gap={8} flexWrap="wrap">
              <Box
                flex="1"
                className="glass-card fade-in"
                p={4}
                borderRadius="lg"
                minW="300px"
              >
                <Text
                  fontWeight="bold"
                  mb={4}
                  fontSize="lg"
                  color="white"
                  fontFamily="Poppins, sans-serif"
                >
                  Test Execution
                </Text>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={executionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
                    <XAxis dataKey="name" stroke="white" />
                    <YAxis stroke="white" />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'black',
                      }}
                    />
                    <Bar dataKey="count" fill="#3182ce" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <Box
                flex="1"
                className="glass-card fade-in"
                p={4}
                borderRadius="lg"
                minW="300px"
              >
                <Text
                  fontWeight="bold"
                  mb={4}
                  fontSize="lg"
                  color="white"
                  fontFamily="Poppins, sans-serif"
                >
                  Healed Elements
                </Text>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th color="white" borderColor="rgba(255, 255, 255, 0.2)">Execution Name</Th>
                      <Th color="white" borderColor="rgba(255, 255, 255, 0.2)">Past ID</Th>
                      <Th color="white" borderColor="rgba(255, 255, 255, 0.2)">New ID</Th>
                      <Th color="white" borderColor="rgba(255, 255, 255, 0.2)">Date</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {healedElements.map((element, index) => (
                      <Tr key={index} className="table-row">
                        <Td color="white" borderColor="rgba(255, 255, 255, 0.2)">{element.name}</Td>
                        <Td color="white" borderColor="rgba(255, 255, 255, 0.2)">{element.pastId}</Td>
                        <Td color="white" borderColor="rgba(255, 255, 255, 0.2)">{element.newId}</Td>
                        <Td color="white" borderColor="rgba(255, 255, 255, 0.2)">{element.date}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Flex>
          </Box>
        </Box>
      </Flex>
    </>
  );
};

export default Dashboard;