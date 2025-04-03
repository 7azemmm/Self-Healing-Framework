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
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .dashboard-bg {
            background: linear-gradient(to right, #f8fafc, #f1f5f9);
          }

          .glass-card {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transition: all 0.2s ease;
          }

          .glass-card:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            transform: translateY(-2px);
          }

          .stat-card {
            animation: fadeIn 0.5s ease-out;
          }

          .gradient-text {
            color: #1a365d;
            font-weight: bold;
          }

          .table-row {
            transition: background-color 0.2s ease;
          }

          .table-row:hover {
            background: #f8fafc;
          }

          .chart-container {
            background: white;
          }

          .select-custom {
            transition: all 0.2s ease;
          }

          .select-custom:hover {
            border-color: #3182ce;
          }

          .progress-bar-animated {
            background: #edf2f7;
          }
        `}
      </style>

      <Flex h="100vh" overflow="hidden">
        <Sidebar />
        <Box
          ml={{ base: "60px", md: "240px" }}
          flex="1"
          className="dashboard-bg"
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          <Navbar />
          <Box flex="1" px={8} py={6} overflowY="auto">
            {/* Dashboard Header */}
            <Flex
              justify="space-between"
              align="center"
              mb={8}
            >
              <Text
                fontSize="2xl"
                fontWeight="bold"
                color="#1a365d"
                letterSpacing="tight"
              >
                Project Dashboard
              </Text>

              {/* Project Selection */}
              <Box w="300px">
                <Select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  bg="white"
                  color="#2d3748"
                  border="1px solid #e2e8f0"
                  borderRadius="md"
                  h="40px"
                  fontSize="md"
                  _hover={{
                    borderColor: "#3182ce",
                    bg: "white"
                  }}
                  _focus={{
                    borderColor: "#3182ce",
                    boxShadow: "0 0 0 1px #3182ce"
                  }}
                >
                  {projects.map(project => (
                    <option key={project.project_id} value={project.project_id}>
                      {project.project_name}
                    </option>
                  ))}
                </Select>
              </Box>
            </Flex>

            {/* Stats Cards */}
            <Flex gap={6} mb={8}>
              <Box
                className="glass-card stat-card"
                p={6}
                borderRadius="md"
                flex="1"
              >
                <Text
                  color="#4a5568"
                  mb={2}
                  fontSize="md"
                  fontWeight="medium"
                >
                  Total Scenarios
                </Text>
                <Text
                  fontSize="3xl"
                  color="#2d3748"
                  fontWeight="bold"
                >
                  {totalScenarios.toLocaleString()}
                </Text>
              </Box>
              <Box
                className="glass-card stat-card"
                p={6}
                borderRadius="md"
                flex="1"
              >
                <Text
                  color="#4a5568"
                  mb={2}
                  fontSize="md"
                  fontWeight="medium"
                >
                  Healing Rate
                </Text>
                <Text
                  fontSize="3xl"
                  color="#2d3748"
                  fontWeight="bold"
                >
                  {healedPercentage}%
                </Text>
                <Progress
                  value={healedPercentage}
                  size="sm"
                  mt={4}
                  borderRadius="full"
                  bg="#edf2f7"
                  sx={{
                    '& > div': {
                      background: '#3182ce',
                      transition: 'width 0.5s ease-out',
                    },
                  }}
                />
              </Box>
            </Flex>

            {/* Charts and Table */}
            <Flex gap={6} flexWrap={{ base: "wrap", xl: "nowrap" }}>
              <Box
                flex="1.5"
                className="glass-card"
                p={6}
                borderRadius="md"
                minW={{ base: "100%", xl: "0" }}
              >
                <Text
                  fontSize="md"
                  fontWeight="medium"
                  color="#2d3748"
                  mb={6}
                >
                  Test Execution Trends
                </Text>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={executionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#4a5568" />
                    <YAxis stroke="#4a5568" />
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        color: '#2d3748',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#3182ce"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <Box
                flex="1"
                className="glass-card"
                p={6}
                borderRadius="md"
                minW={{ base: "100%", xl: "0" }}
              >
                <Text
                  fontSize="md"
                  fontWeight="medium"
                  color="#2d3748"
                  mb={6}
                >
                  Recent Healings
                </Text>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th color="#4a5568" borderColor="#e2e8f0">Execution</Th>
                      <Th color="#4a5568" borderColor="#e2e8f0">Past ID</Th>
                      <Th color="#4a5568" borderColor="#e2e8f0">New ID</Th>
                      <Th color="#4a5568" borderColor="#e2e8f0">Date</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {healedElements.map((element, index) => (
                      <Tr key={index} className="table-row">
                        <Td color="#2d3748" borderColor="#e2e8f0">{element.name}</Td>
                        <Td color="#2d3748" borderColor="#e2e8f0">{element.pastId}</Td>
                        <Td color="#2d3748" borderColor="#e2e8f0">{element.newId}</Td>
                        <Td color="#2d3748" borderColor="#e2e8f0">{element.date}</Td>
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