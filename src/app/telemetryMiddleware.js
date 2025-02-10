import { performance } from 'perf_hooks';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

// Security Constants
const ACTION_THRESHOLD_MS = 200; // Alert threshold for slow actions
const MAX_ACTION_HISTORY = 1000; // Prevent memory leaks
const ENCRYPTION_IV_LENGTH = 16; // AES block size in bytes

// Telemetry Storage (In-memory cache with rotation)
const actionTelemetry = {
  metrics: new Map(),
  history: [],
  sessionId: uuidv4()
};

// Encryption Helper
const encryptPayload = (data, secret) => {
  try {
    const iv = CryptoJS.lib.WordArray.random(ENCRYPTION_IV_LENGTH);
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      CryptoJS.enc.Utf8.parse(secret),
      { iv }
    );
    return {
      iv: iv.toString(),
      content: encrypted.toString()
    };
  } catch (error) {
    console.error('Telemetry encryption failed:', error);
    return null;
  }
};

// Performance Middleware
export const telemetryMiddleware = store => next => action => {
  const startTime = performance.now();
  const actionId = uuidv4();
  const actionType = action.type || 'UNKNOWN_ACTION';
  
  // Create action metadata
  const actionMeta = {
    id: actionId,
    type: actionType,
    start: new Date().toISOString(),
    duration: 0,
    success: false,
    error: null,
    stateHash: null,
    encryptedState: null
  };

  // Execute the action
  try {
    const result = next(action);
    
    // Post-action processing
    const endTime = performance.now();
    actionMeta.duration = endTime - startTime;
    actionMeta.success = true;
    
    // Capture state snapshot
    try {
      const currentState = store.getState();
      const stateHash = CryptoJS.SHA256(JSON.stringify(currentState)).toString();
      actionMeta.stateHash = stateHash;
      
      // Encrypt state if secret available
      if (process.env.REACT_APP_REDUX_SECRET) {
        actionMeta.encryptedState = encryptPayload(
          { state: currentState, action },
          process.env.REACT_APP_REDUX_SECRET
        );
      }
    } catch (stateError) {
      console.error('State capture failed:', stateError);
    }

    // Performance monitoring
    if (actionMeta.duration > ACTION_THRESHOLD_MS) {
      console.warn(`⏱️ Slow action detected: ${actionType} (${actionMeta.duration.toFixed(2)}ms)`);
      
      // Integrate with error tracking (Sentry/LogRocket)
      if (typeof window.Sentry !== 'undefined') {
        window.Sentry.captureMessage('Slow Redux Action', {
          level: 'warning',
          contexts: {
            performance: {
              duration: actionMeta.duration,
              action_type: actionType
            }
          }
        });
      }
    }

    // Update telemetry storage
    actionTelemetry.metrics.set(actionType, {
      count: (actionTelemetry.metrics.get(actionType)?.count || 0) + 1,
      totalDuration: (actionTelemetry.metrics.get(actionType)?.totalDuration || 0) + actionMeta.duration,
      lastInvoked: new Date().toISOString()
    });

    // Maintain history buffer
    if (actionTelemetry.history.length >= MAX_ACTION_HISTORY) {
      actionTelemetry.history.shift();
    }
    actionTelemetry.history.push(actionMeta);

    return result;
  } catch (error) {
    // Error handling
    const endTime = performance.now();
    actionMeta.duration = endTime - startTime;
    actionMeta.error = {
      message: error.message,
      stack: error.stack,
      code: error.code || 'UNKNOWN_ERROR'
    };

    // Update error metrics
    const errorKey = `${actionType}_ERROR`;
    actionTelemetry.metrics.set(errorKey, {
      count: (actionTelemetry.metrics.get(errorKey)?.count || 0) + 1,
      lastError: new Date().toISOString()
    });

    // Critical error logging
    console.error(`🛑 Action Error: ${actionType}`, {
      duration: actionMeta.duration,
      error: actionMeta.error
    });

    // Propagate error to error tracking
    if (typeof window.Sentry !== 'undefined') {
      window.Sentry.captureException(error, {
        contexts: {
          redux: {
            action: actionType,
            state: actionMeta.encryptedState
          }
        }
      });
    }

    throw error;
  }
};

// Telemetry Access API
export const getActionMetrics = () => {
  return {
    sessionId: actionTelemetry.sessionId,
    metrics: Object.fromEntries(actionTelemetry.metrics.entries()),
    recentActions: [...actionTelemetry.history]
  };
};

export const resetActionMetrics = () => {
  actionTelemetry.metrics.clear();
  actionTelemetry.history = [];
};