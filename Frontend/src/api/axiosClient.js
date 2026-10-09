import axios from 'axios';

// Get API base URL with fallback to standard local backend port
const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT token from localStorage if present
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('clinicflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch 401 Unauthorized errors (except auth endpoints)
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const originalRequestUrl = error.config?.url || '';
      const isAuthEndpoint =
        originalRequestUrl.includes('/auth/login') ||
        originalRequestUrl.includes('/auth/register');

      if (!isAuthEndpoint) {
        localStorage.removeItem('clinicflow_token');
        localStorage.removeItem('clinicflow_user');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
