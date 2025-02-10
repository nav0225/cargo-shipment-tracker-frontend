import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createHash } from 'crypto-js/sha256';
import CryptoJS from 'crypto-js';

// Security-conscious base query
const securedBaseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  prepareHeaders: (headers, { getState }) => {
    // Add security headers
    headers.set('Content-Security-Policy', "default-src 'self'");
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Request-ID', CryptoJS.lib.WordArray.random(16).toString());
    
    // Add auth token
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
  timeout: 10000 // 10s timeout
});

export const shipmentApi = createApi({
  reducerPath: 'shipmentApi',
  baseQuery: async (args, api, extraOptions) => {
    try {
      const result = await securedBaseQuery(args, api, extraOptions);
      if (result.error) {
        // Centralized error logging
        console.error('API Error:', {
          status: result.error.status,
          data: result.error.data,
          endpoint: args.url
        });
      }
      return result;
    } catch (error) {
      // Network error handling
      console.error('Network Failure:', {
        endpoint: args.url,
        error: error.message
      });
      return {
        error: {
          status: 'NETWORK_ERROR',
          error: 'Connection unavailable',
          timestamp: Date.now()
        }
      };
    }
  },
  tagTypes: ['Shipments'],
  endpoints: (builder) => ({
    // endpoints here (to maintain previous security transforms)
  })
});