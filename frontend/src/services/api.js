import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor për token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('🔑 Token from localStorage:', token ? 'Yes' : 'No');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to headers');
    } else {
      console.log('⚠️ No token found');
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor për gabime
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response success:', response.status);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.status, error.message);
    if (error.code === 'ERR_NETWORK') {
      console.error('Gabim rrjeti: Backend-i nuk po përgjigjet');
    }
    if (error.response?.status === 401) {
      console.error('Unauthorized - Token i pavlefshëm');
      localStorage.removeItem('access_token');
      // Mos e ridrejto menjëherë për të parë gabimin
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;