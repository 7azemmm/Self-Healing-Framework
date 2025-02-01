import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login/`, { email, password });
    localStorage.setItem('access_token', response.data.access); 
    return response.data;
  } catch (error) {
    throw error.response?.data || 'Login failed';
  }
};

export const signup = async (fullName, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/signup/`, {
      full_name: fullName,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || 'Signup failed';
  }
};

export const logout = () => {
  localStorage.removeItem('access_token');
};
