import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Detect platform and use appropriate URL
// For web development, use localhost. For mobile device testing, use your local IP
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000'; // Use localhost for web to avoid CORS issues
  }
  return 'http://10.100.0.222:8000'; // Network IP for mobile device testing
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'auth_token';

export const storeToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// Add token to requests if available
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication API calls
export const login = async (email, password) => {
  try {
    console.log('API: Starting login request...', { email });
    
    const response = await api.post('/auth/login-json', {
      email: email, // Use email field for JSON endpoint
      password,
    });
    
    console.log('API: Login response:', response.data);
    
    if (response.data.access_token) {
      await storeToken(response.data.access_token);
      return {
        success: true,
        token: response.data.access_token,
        user: response.data.user,
      };
    }
    
    return {
      success: false,
      error: 'No token received',
    };
  } catch (error) {
    console.error('API: Login error:', error);
    console.error('API: Login error response:', error.response?.data);
    
    // Handle validation errors from FastAPI
    let errorMessage = 'Login failed';
    
    if (error.response?.data?.detail) {
      if (Array.isArray(error.response.data.detail)) {
        // Handle Pydantic validation errors
        const validationErrors = error.response.data.detail.map(err => err.msg).join(', ');
        errorMessage = validationErrors;
      } else {
        errorMessage = error.response.data.detail;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const register = async (email, password, role = 'guardian') => {
  try {
    console.log('API: Starting registration request...', { email, role });
    console.log('API: Using base URL:', API_BASE_URL);
    
    const response = await api.post('/auth/register', {
      email,
      password,
      role
    });
    
    console.log('API: Registration response:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('API: Registration error:', error);
    console.error('API: Error response:', error.response?.data);
    console.error('API: Error status:', error.response?.status);
    console.error('API: Error message:', error.message);
    
    // Handle validation errors from FastAPI
    let errorMessage = 'Registration failed';
    
    if (error.response?.data?.detail) {
      if (Array.isArray(error.response.data.detail)) {
        // Handle Pydantic validation errors
        const validationErrors = error.response.data.detail.map(err => err.msg).join(', ');
        errorMessage = validationErrors;
      } else {
        errorMessage = error.response.data.detail;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
};

export const logout = async () => {
  try {
    await removeToken();
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'Logout failed' };
  }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  const token = await getToken();
  return !!token;
};

export default api;