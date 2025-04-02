import axios from 'axios';

const API_URL = 'http://localhost:8000/api';
axios.defaults.baseURL = API_URL;
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 403 || error.response.status === 401)) {
      console.log('Unauthorized access - redirecting to login');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


export const login = async (email, password) => {
  try {
    const response = await axios.post(`/login/`, { email, password });
    localStorage.setItem('access_token', response.data.access);
    return response.data;
  } catch (error) {
    throw error.response?.data || 'Login failed';
  }
};

export const signup = async (fullName, email, password) => {
  try {
    const response = await axios.post(`/signup/`, {
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
