import { shipmentApi } from './shipmentApi';
import { setupStore } from '../app/store';
import { waitFor } from '@testing-library/react';

describe('shipmentApi', () => {
  const store = setupStore();
  
  test('getShipments fails with network error', async () => {
    const result = await store.dispatch(
      shipmentApi.endpoints.getShipments.initiate()
    );
    
    await waitFor(() => {
      expect(result.status).toBe('rejected');
      expect(result.error).toMatchObject({
        status: 'NETWORK_ERROR'
      });
    });
  });
});