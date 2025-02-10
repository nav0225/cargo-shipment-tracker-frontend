import axios from 'axios';
import CryptoJS from 'crypto-js';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Security-Policy': "default-src 'self'",
    'X-Content-Type-Options': 'nosniff'
  }
});

// Add request fingerprinting
api.interceptors.request.use(config => {
  config.headers['X-Request-Fingerprint'] = CryptoJS.SHA256(
    `${config.method}-${config.url}-${Date.now()}`
  ).toString();
  
  return config;
});

// Add circuit breaker pattern
let consecutiveFailures = 0;
let lastFailureTime = 0;

api.interceptors.response.use(
  response => {
    consecutiveFailures = 0;
    return response;
  },
  error => {
    const now = Date.now();
    if (now - lastFailureTime < 30000) {
      consecutiveFailures++;
    } else {
      consecutiveFailures = 1;
    }
    lastFailureTime = now;

    if (consecutiveFailures > 3) {
      console.error('Circuit breaker tripped!');
      return Promise.reject(new Error('Service unavailable'));
    }

    return Promise.reject(error);
  }
);

export default api;