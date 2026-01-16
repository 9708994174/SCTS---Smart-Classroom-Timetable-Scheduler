import axios from 'axios';

// Get API URL from environment variable or detect automatically
const getApiUrl = () => {
  // Priority 1: REACT_APP_API_URL (explicit API URL)
  if (process.env.REACT_APP_API_URL) {
    console.log('Using REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Priority 2: REACT_APP_BACKEND_URL (backend URL)
  if (process.env.REACT_APP_BACKEND_URL) {
    console.log('Using REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  // Check if we're in production
  const isProduction = process.env.NODE_ENV === 'production' || 
                       (window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1');
  
  if (isProduction) {
    // In production without env var, don't use localhost
    // Use empty string for relative URLs or detect from window.location
    console.warn('⚠️ REACT_APP_BACKEND_URL not set in production! Using relative URL.');
    console.warn('⚠️ Please set REACT_APP_BACKEND_URL environment variable in Vercel.');
    // Return empty string for relative URLs (only works if backend is proxied/same domain)
    return '';
  }
  
  // Development fallback
  console.log('Development mode: Using localhost:5000');
  return 'http://localhost:5000';
};

// Get the API URL
const apiUrl = getApiUrl();

// Log the final API URL being used (for debugging)
const isProduction = process.env.NODE_ENV === 'production' || 
                     (typeof window !== 'undefined' && 
                      window.location.hostname !== 'localhost' && 
                      window.location.hostname !== '127.0.0.1');

if (apiUrl) {
  console.log('🌐 API Base URL:', apiUrl);
} else {
  if (isProduction) {
    console.error('❌ CRITICAL: REACT_APP_BACKEND_URL is not set in production!');
    console.error('❌ All API calls will fail. Please set REACT_APP_BACKEND_URL in Vercel environment variables.');
    console.error('❌ Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'unknown');
    // Show alert to user in production
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      setTimeout(() => {
        alert('⚠️ Configuration Error: Backend URL not configured. Please contact administrator.');
      }, 2000);
    }
  } else {
    console.log('🌐 Using relative URLs (same origin)');
  }
}

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: apiUrl,
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
    // Handle 405 Method Not Allowed - usually means wrong URL
    if (error.response?.status === 405) {
      console.error('❌ 405 Method Not Allowed - API endpoint not found');
      console.error('❌ Request URL:', error.config?.url);
      console.error('❌ Base URL:', error.config?.baseURL || 'none (relative)');
      console.error('❌ Full URL:', error.config?.baseURL ? error.config.baseURL + error.config.url : window.location.origin + error.config.url);
      if (!apiUrl || apiUrl === '') {
        console.error('❌ REACT_APP_BACKEND_URL is not set! Set it in Vercel environment variables.');
      }
    }
    
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
      console.error('Request URL:', error.config?.url);
      console.error('Base URL:', error.config?.baseURL || 'none (relative)');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

