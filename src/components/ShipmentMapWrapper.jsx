import React, { lazy, Suspense, useEffect } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from './ErrorBoundary';
import { WebSocketSubject } from 'rxjs/webSocket';
import CryptoJS from 'crypto-js';
import './ShipmentMapWrapper.css';

const SecureMap = lazy(() => import('./ShipmentMap'));

const ShipmentMapWrapper = ({ shipmentId }) => {
  const [socket$, setSocket$] = useState(null);

  // Secure WebSocket connection
  useEffect(() => {
    if (shipmentId) {
      const ws = new WebSocketSubject({
        url: `${process.env.REACT_APP_WS_URL}/${shipmentId}`,
        serializer: (msg) => CryptoJS.AES.encrypt(
          JSON.stringify(msg),
          process.env.REACT_APP_WS_SECRET
        ).toString(),
      });

      setSocket$(ws);

      return () => {
        ws.complete();
        setSocket$(null);
      };
    }
  }, [shipmentId]);

  return (
    <ErrorBoundary fallback={
      <div className="map-error">
        <h3>Secure Map Unavailable</h3>
        <p>Real-time tracking disabled</p>
      </div>
    }>
      <Suspense fallback={
        <div className="secure-map-loading">
          <div className="encrypted-spinner" />
          <p>Initializing secure map...</p>
        </div>
      }>
        <SecureMap 
          shipmentId={shipmentId}
          socket$={socket$}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

ShipmentMapWrapper.propTypes = {
  shipmentId: PropTypes.string,
};

export default ShipmentMapWrapper;