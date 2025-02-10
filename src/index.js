import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// environment validation
const validateEnvironment = () => {
  // Security-conscious logging
  if (process.env.NODE_ENV === 'development') {
    console.info('Environment Validation:', {
      nodeEnv: process.env.NODE_ENV,
      apiEndpoint: process.env.REACT_APP_API_URL,
      reduxSecretConfigured: !!process.env.REACT_APP_REDUX_SECRET,
      buildTime: process.env.REACT_APP_BUILD_TIME || 'DEV'
    });
  }

  // Cryptography validation
  if (!process.env.REACT_APP_REDUX_SECRET) {
    const error = new Error('FATAL: Missing Redux encryption secret');
    console.error('Security Violation:', error.message);
    throw error;
  }

  // Key length validation
  if (process.env.REACT_APP_REDUX_SECRET.length !== 64) {
    const error = new Error('FATAL: Invalid encryption key length (requires 256-bit hex)');
    console.error('Security Violation:', error.message);
    throw error;
  }

  // CSP validation
  if (window.location.protocol === 'https:' && !process.env.REACT_APP_API_URL?.startsWith('https')) {
    console.warn('Security Warning: Mixed content detected - HTTPS site with HTTP API');
  }
};

// Execute validation before rendering
try {
  validateEnvironment();
} catch (error) {
  // Fail fast if security requirements not met
  const errorDisplay = document.createElement('div');
  errorDisplay.style.color = 'red';
  errorDisplay.style.padding = '2rem';
  errorDisplay.style.fontFamily = 'monospace';
  errorDisplay.innerHTML = `
    <h1>Security Configuration Error</h1>
    <p>${error.message}</p>
    <p>Application cannot start</p>
  `;
  document.body.appendChild(errorDisplay);
  throw error; // Prevent React from mounting
}

// root initialization
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('DOM root element missing');

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Web Vitals with security tagging
reportWebVitals((metrics) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug('Performance Metrics:', {
      ...metrics,
      sessionId: crypto.randomUUID(),
      secureContext: window.isSecureContext
    });
  }
});