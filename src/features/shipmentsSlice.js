import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';
import { createHash } from 'crypto-js/sha256';
import { performance } from 'perf_hooks';
import api from '../services/api';

// ==================== Secure Selector Factory ====================
const SELECTOR_METRICS = new Map();
const MAX_SELECTOR_ARGS = 3; // Maximum allowed arguments for selectors

const createSecureSelector = (name, selectorFn) => {
  if (typeof selectorFn !== 'function') {
    throw new Error(`Selector ${name} must be a function`);
  }

  const selectorHash = createHash('sha256').update(name).toString();

  return createSelector(
    selectorFn.dependencies || [state => state],
    (...args) => {
      // Argument validation
      if (args.length > MAX_SELECTOR_ARGS) {
        throw new Error(`Selector ${name} exceeded maximum argument limit`);
      }

      const start = performance.now();
      const result = selectorFn(...args);
      const duration = performance.now() - start;

      // Telemetry collection
      SELECTOR_METRICS.set(selectorHash, {
        calls: (SELECTOR_METRICS.get(selectorHash)?.calls || 0) + 1,
        totalDuration: (SELECTOR_METRICS.get(selectorHash)?.totalDuration || 0) + duration,
        lastCall: new Date().toISOString()
      });

      // Performance guardrails
      if (duration > 50) { // 50ms threshold
        console.warn(`[Perf] Selector ${name} took ${duration.toFixed(2)}ms`);
      }

      return result;
    }
  );
};

// ==================== Async Thunks with Security ====================
export const fetchShipments = createAsyncThunk('shipments/fetchShipments', 
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/shipments');
      if (!Array.isArray(response.data?.data)) {
        throw new Error('Invalid response structure');
      }
      return response.data.data;
    } catch (error) {
      console.error('[API Error] fetchShipments:', error);
      return rejectWithValue({
        code: error.response?.status || 500,
        message: error.response?.data?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export const createShipment = createAsyncThunk('shipments/createShipment',
  async (shipmentData, { rejectWithValue }) => {
    try {
      if (!shipmentData?.containerId || !shipmentData?.route) {
        throw new Error('Missing required shipment fields');
      }
      
      const response = await api.post('/shipments', shipmentData);
      return response.data.data;
    } catch (error) {
      console.error('[API Error] createShipment:', error);
      return rejectWithValue({
        code: error.response?.status || 500,
        message: error.response?.data?.message || 'Creation failed',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// ==================== Slice Configuration ====================
const initialState = {
  shipments: [],
  status: 'idle',
  error: null,
  filter: null,
  lastUpdated: null,
  version: 1 // Schema version for state migrations
};

const shipmentsSlice = createSlice({
  name: 'shipments',
  initialState,
  reducers: {
    resetShipments: (state) => {
      if (state.status !== 'loading') {
        Object.assign(state, initialState);
        state.version = initialState.version + 1; // Force cache invalidation
      }
    },
    setFilter: (state, action) => {
      if (typeof action.payload === 'string' || action.payload === null) {
        state.filter = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShipments.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchShipments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.shipments = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchShipments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to fetch shipments';
      })
      .addCase(createShipment.fulfilled, (state, action) => {
        if (Array.isArray(state.shipments)) {
          state.shipments.push(action.payload);
          state.lastUpdated = new Date().toISOString();
        }
      })
      .addCase(createShipment.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to create shipment';
      });
  }
});


const baseSelectors = {
  selectRawState: (state) => state.shipments,
  selectAllShipments: createSelector(
    [state => state.shipments.shipments],
    (shipments) => Array.isArray(shipments) ? shipments : []
  ),
  selectStatus: (state) => state.shipments.status,
  selectError: (state) => state.shipments.error,
  selectLastUpdated: (state) => state.shipments.lastUpdated
};

export const selectFilteredShipments = createSecureSelector(
  'filteredShipments',
  createSelector(
    [baseSelectors.selectAllShipments, (state, filter) => filter],
    (shipments, filter) => {
      if (!filter) return shipments;
      return shipments.filter(s => {
        if (typeof s.status !== 'string') return false;
        return s.status.toLowerCase() === filter.toLowerCase();
      });
    }
  )
);

export const selectShipmentStats = createSecureSelector(
  'shipmentStats',
  createSelector(
    [baseSelectors.selectAllShipments],
    (shipments) => {
      return shipments.reduce((stats, s) => {
        stats.total++;
        stats[s.status] = (stats[s.status] || 0) + 1;
        return stats;
      }, { total: 0 });
    }
  )
);

// ==================== Diagnostic Utilities ====================
export const getSelectorMetrics = () => new Map(SELECTOR_METRICS);
export const resetSelectorMetrics = () => SELECTOR_METRICS.clear();

export const { resetShipments, setFilter } = shipmentsSlice.actions;
export default shipmentsSlice.reducer;