import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Detect platform and use appropriate URL
// For web development, use localhost. For mobile device testing, use your local IP
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8001'; // Use localhost for web to avoid CORS issues
  }
  return 'http://192.168.137.1:8001'; // PC Hotspot IP for mobile device testing
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
    console.log('🚀 API: Starting registration request...');
    console.log('📧 API: Email:', email);
    console.log('👤 API: Role:', role);
    console.log('🌐 API: Using base URL:', API_BASE_URL);
    console.log('📱 API: Platform:', Platform.OS);
    
    // Test basic connectivity first
    console.log('🔍 API: Testing basic connectivity...');
    
    // Add timeout and more detailed config
    const requestConfig = {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    };
    
    console.log('📋 API: Request config:', requestConfig);
    console.log('📦 API: Request payload:', { email, password: '[HIDDEN]', role });
    
    // Try to ping the server first
    try {
      console.log('🏓 API: Pinging server health endpoint...');
      const healthResponse = await api.get('/health', { timeout: 5000 });
      console.log('✅ API: Health check successful:', healthResponse.data);
    } catch (healthError) {
      console.error('❌ API: Health check failed:', healthError.message);
      console.error('🔧 API: Health error details:', {
        code: healthError.code,
        message: healthError.message,
        response: healthError.response?.data,
        status: healthError.response?.status
      });
    }
    
    console.log('📤 API: Sending registration request...');
    const response = await api.post('/auth/register', {
      email,
      password,
      role
    }, requestConfig);
    
    console.log('✅ API: Registration response received!');
    console.log('📊 API: Response status:', response.status);
    console.log('📄 API: Response headers:', response.headers);
    console.log('💾 API: Response data:', response.data);
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ API: Registration error occurred!');
    console.error('🔍 API: Error type:', error.constructor.name);
    console.error('📝 API: Error message:', error.message);
    console.error('🔢 API: Error code:', error.code);
    
    // Network-specific debugging
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      console.error('🌐 API: NETWORK ERROR DETECTED!');
      console.error('🔧 API: This could be due to:');
      console.error('   - Firewall blocking the connection');
      console.error('   - Server not running on specified port');
      console.error('   - Incorrect IP address');
      console.error('   - Mobile device not on same network');
      console.error('   - CORS issues (less likely for mobile)');
    }
    
    // Detailed error analysis
    if (error.response) {
      console.error('📡 API: Server responded with error');
      console.error('🔢 API: Error status:', error.response.status);
      console.error('📄 API: Error headers:', error.response.headers);
      console.error('💾 API: Error data:', error.response.data);
    } else if (error.request) {
      console.error('📡 API: Request was made but no response received');
      console.error('🔧 API: Request details:', error.request);
      console.error('🌐 API: This indicates a network connectivity issue');
    } else {
      console.error('⚙️ API: Error in setting up the request');
      console.error('🔧 API: Setup error:', error.message);
    }
    
    // Additional debugging info
    console.error('🔍 API: Full error object:', {
      name: error.name,
      message: error.message,
      code: error.code,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        baseURL: error.config.baseURL,
        timeout: error.config.timeout
      } : 'No config'
    });
    
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