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

// Request interceptor - SIMPLIFIED
api.interceptors.request.use(
  (config) => {
    
    // Add auth token
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token for non-GET requests
    if (csrfToken && config.method !== 'get') {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    // Ensure content type
    if (config.data && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// SINGLE Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    

    // Handle CSRF token errors
    if (error.response?.status === 403 && 
        (error.response.data?.message?.includes('CSRF') ||
         error.response.data?.error?.includes('CSRF'))) {
      try {
        const response = await api.get('/csrf-token');
        csrfToken = response.data.csrfToken;
        
        // Retry the original request with new CSRF token
        if (originalRequest.method !== 'get') {
          originalRequest.headers['X-CSRF-Token'] = csrfToken;
        }
        return api(originalRequest);
      } catch (csrfError) {
        return Promise.reject(csrfError);
      }
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

getCsrfToken();
export default api;