import axios from 'axios';

// Get API URL from environment variable or detect automatically
const getApiUrl = () => {
  // If REACT_APP_API_URL is explicitly set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In production (Vercel/deployed), use environment variable
  if (process.env.NODE_ENV === 'production') {
    // For Vercel, you MUST set REACT_APP_BACKEND_URL in environment variables
    // Example: REACT_APP_BACKEND_URL=https://your-backend.herokuapp.com
    // If not set, it will try to use relative URL (only works if backend is on same domain)
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    if (backendUrl) {
      return backendUrl;
    }
    // Fallback to relative URL (only works if backend is on same domain/subdomain)
    return '';
  }
  
  // Development fallback
  return 'http://localhost:5000';
};

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Set to true if using cookies
});

// Request interceptor - Add auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

