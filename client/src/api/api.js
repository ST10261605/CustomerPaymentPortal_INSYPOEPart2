import axios from "axios";

const api = axios.create({
  baseURL: 'https://localhost:5000/api',
  timeout: 30000,
  withCredentials: true,

});

let csrfToken = '';
let isRefreshingCsrf = false;
let csrfPromise = null;
let refreshTokenPromise = null;

const refreshAuthToken = async () => {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = new Promise(async (resolve, reject) => {
    try {
      const response = await api.post('/auth/refresh', {}, {
        skipAuthRefresh: true // Custom flag to prevent infinite loop
      });
      
      const newAccessToken = response.data.accessToken;
      localStorage.setItem('accessToken', newAccessToken);
      resolve(newAccessToken);
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      reject(error);
    } finally {
      refreshTokenPromise = null;
    }
  });

  return refreshTokenPromise;
};


// Function to get CSRF token with retry logic
export const getCsrfToken = async () => {
  // If already refreshing, return the existing promise
  if (isRefreshingCsrf) {
    return csrfPromise;
  }

  isRefreshingCsrf = true;
  csrfPromise = new Promise(async (resolve, reject) => {
    try {
      const response = await api.get('/csrf-token');
      csrfToken = response.data.csrfToken;
      resolve(csrfToken);
    } catch (error) {
      reject(error);
    } finally {
      isRefreshingCsrf = false;
    }
  });

  return csrfPromise;
};

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Skip auth refresh for refresh token requests to prevent infinite loop
    if (config.skipAuthRefresh) {
      return config;
    }

    // Add CSRF token for state-changing requests
    if (csrfToken && (config.method === 'post' || config.method === 'put' || config.method === 'delete' || config.method === 'patch')) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    // Add security header for non-GET requests
    if (config.method !== 'get') {
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
    }

    // Add authorization token if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle CSRF token errors
    if (error.response?.status === 403 && 
        (error.response.data?.code === 'EBADCSRFTOKEN' || 
         error.response.data?.message?.includes('CSRF') ||
         error.response.data?.error?.includes('CSRF'))) {
      try {
        await getCsrfToken();
        if (csrfToken && (originalRequest.method === 'post' || originalRequest.method === 'put' || originalRequest.method === 'delete')) {
          originalRequest.headers['X-CSRF-Token'] = csrfToken;
        }
        return api(originalRequest);
      } catch (csrfError) {
        return Promise.reject(csrfError);
      }
    }

     // Handle authentication errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.skipAuthRefresh) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshAuthToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login if refresh fails
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle authentication errors
    if (error.response?.status === 401 && !originalRequest.skipAuthRefresh) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Initialize CSRF token when the app loads
getCsrfToken();
export default api;