import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import CryptoJS from 'crypto-js';
import { telemetryMiddleware } from './telemetryMiddleware';
import shipmentsReducer from '../features/shipmentsSlice';

// Security Constants
const PERSIST_VERSION = 1; // Increment for breaking state changes
const MAX_STATE_SIZE_KB = 1024; // 1MB state limit
const ENCRYPTION_IV_LENGTH = 16;

// Secure Storage Configuration
const persistConfig = {
  key: 'root',
  version: PERSIST_VERSION,
  storage,
  whitelist: ['shipments'],
  serialize: (data) => {
    if (!process.env.REACT_APP_REDUX_SECRET) {
      throw new Error('Encryption secret missing');
    }
    
    // State size validation
    const sizeKB = new TextEncoder().encode(JSON.stringify(data)).length / 1024;
    if (sizeKB > MAX_STATE_SIZE_KB) {
      throw new Error(`State size exceeds ${MAX_STATE_SIZE_KB}KB limit`);
    }

    // AES-256-CBC encryption
    const iv = CryptoJS.lib.WordArray.random(ENCRYPTION_IV_LENGTH);
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      CryptoJS.enc.Utf8.parse(process.env.REACT_APP_REDUX_SECRET),
      { iv }
    );

    return JSON.stringify({
      iv: iv.toString(),
      content: encrypted.toString()
    });
  },
  deserialize: (data) => {
    try {
      const { iv, content } = JSON.parse(data);
      const bytes = CryptoJS.AES.decrypt(
        content,
        CryptoJS.enc.Utf8.parse(process.env.REACT_APP_REDUX_SECRET),
        { iv: CryptoJS.enc.Hex.parse(iv) }
      );
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error('State decryption failed:', error);
      return undefined; // Force rehydration
    }
  },
  migrate: (state) => {
    if (state?._persist?.version !== PERSIST_VERSION) {
      return Promise.resolve(undefined); // Clear state on version mismatch
    }
    return Promise.resolve(state);
  }
};

// Enhanced Middleware Configuration
const getProductionMiddleware = (getDefaultMiddleware) => [
  ...getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      warnAfter: 100 // ms threshold
    },
    immutableCheck: {
      warnAfter: 50 // ms threshold
    }
  }),
  telemetryMiddleware
];

const getDevelopmentMiddleware = (getDefaultMiddleware) => [
  ...getProductionMiddleware(getDefaultMiddleware),
  require('redux-logger').createLogger({
    collapsed: true,
    duration: true,
    timestamp: true,
    level: {
      prevState: 'debug',
      action: 'info',
      nextState: 'debug',
      error: 'error'
    }
  })
];

// Store Initialization
const store = configureStore({
  reducer: {
    shipments: persistReducer(persistConfig, shipmentsReducer)
  },
  middleware: process.env.NODE_ENV === 'production' 
    ? getProductionMiddleware 
    : getDevelopmentMiddleware,
  devTools: process.env.NODE_ENV === 'development' ? {
    trace: true,
    traceLimit: 25,
    actionSanitizer: (action) => ({
      ...action,
      type: action.type.toString()
    }),
    stateSanitizer: (state) => {
      if (state?.shipments?.shipments) {
        return {
          ...state,
          shipments: {
            ...state.shipments,
            shipments: `[${state.shipments.shipments.length} items]`
          }
        };
      }
      return state;
    }
  } : false,
  enhancers: (defaultEnhancers) => [
    ...defaultEnhancers,
    // Future enhancers can be added here
  ]
});

// Store Validation
const validateStore = () => {
  const state = store.getState();
  
  // State integrity check
  if (!state?.shipments?._persist) {
    console.error('Store validation failed: Missing persist state');
    store.dispatch({ type: 'STORE/RESET' });
  }
};

// Periodic store validation
setInterval(validateStore, 60 * 1000); // Every minute

export const persistor = persistStore(store, null, () => {
  validateStore();
});

export default store;