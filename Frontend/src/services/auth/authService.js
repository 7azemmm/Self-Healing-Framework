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
  window.location.href = '/login';
};

export const getUserData = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await axios.get('/get_user/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data; // { id, full_name, email }
  } catch (error) {
    throw error.response?.data || 'Failed to fetch user data';
  }
};

export const updateProfile = async (userData) => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await axios.put('/update_profile/', userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || 'Failed to update profile';
  }
};
