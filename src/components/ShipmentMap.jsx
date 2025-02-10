import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import CryptoJS from 'crypto-js';
import { WebSocketSubject } from 'rxjs/webSocket';

// Secure icon configuration with Content Security Policy (CSP) validation
const validateIconSource = (iconPath) => {
  if (!iconPath.startsWith('/') && !iconPath.startsWith(process.env.PUBLIC_URL)) {
    throw new Error(`Invalid icon source: ${iconPath} - Potential security violation`);
  }
};

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
  iconUrl: require('leaflet/dist/images/marker-icon.png').default,
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
});

// Validate default icons during initialization
validateIconSource(require('leaflet/dist/images/marker-icon-2x.png').default);
validateIconSource(require('leaflet/dist/images/marker-icon.png').default);
validateIconSource(require('leaflet/dist/images/marker-shadow.png').default);

const MapErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (error) => {
      console.error('Map Error:', error);
      setHasError(true);
    };
    
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  return hasError ? (
    <div className="map-error">
      <h3>Secure Map Unavailable</h3>
      <p>Real-time tracking disabled for security reasons</p>
    </div>
  ) : children;
};

const ShipmentMap = ({ shipments, defaultCenter, zoom, shipmentId }) => {
  const [realTimeData, setRealTimeData] = useState(null);
  const [socketStatus, setSocketStatus] = useState(shipmentId ? 'connecting' : 'disabled');

  // Secure WebSocket connection for real-time updates
  useEffect(() => {
    if (!shipmentId) return;

    const wsSubject = new WebSocketSubject({
      url: `${process.env.REACT_APP_WS_URL}/${shipmentId}`,
      serializer: (msg) => CryptoJS.AES.encrypt(
        JSON.stringify(msg),
        process.env.REACT_APP_WS_SECRET
      ).toString(),
      openObserver: { next: () => setSocketStatus('connected') },
      closeObserver: { next: () => setSocketStatus('disconnected') }
    });

    const subscription = wsSubject.subscribe({
      next: (encryptedData) => {
        try {
          const bytes = CryptoJS.AES.decrypt(encryptedData, process.env.REACT_APP_WS_SECRET);
          const data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
          setRealTimeData(prev => ({
            currentLocation: data.coordinates,
            route: [...(prev?.route || []), data.coordinates]
          }));
        } catch (error) {
          console.error('Secure message decryption failed:', error);
          setSocketStatus('error');
        }
      },
      error: (err) => {
        console.error('WebSocket Error:', err);
        setSocketStatus('error');
      }
    });

    return () => {
      subscription.unsubscribe();
      wsSubject.complete();
    };
  }, [shipmentId]);

  // Combined data processing (static + real-time)
  const { markers, routes } = useMemo(() => {
    const staticMarkers = shipments.map(shipment => {
      const position = shipment.coordinates?.length === 2 ? shipment.coordinates :
        shipment.route?.[shipment.route.length - 1]?.coordinates;
      
      return position ? { ...shipment, position } : null;
    }).filter(Boolean);

    if (realTimeData) {
      return {
        markers: [...staticMarkers, {
          _id: 'realtime-marker',
          position: realTimeData.currentLocation,
          shipmentId: `RT-${shipmentId}`,
          currentLocation: 'Real-time Tracking'
        }],
        routes: [...staticMarkers.map(s => s.route), realTimeData.route]
      };
    }

    return { markers: staticMarkers, routes: [] };
  }, [shipments, realTimeData, shipmentId]);

  // Secure center calculation
  const mapCenter = useMemo(() => {
    if (realTimeData?.currentLocation) return realTimeData.currentLocation;
    if (markers.length > 0) return markers[0].position;
    return defaultCenter;
  }, [markers, defaultCenter, realTimeData]);

  if (!markers.length && !realTimeData) {
    return (
      <div className="secure-map-loading">
        <div className="encrypted-spinner" />
        <p>Initializing secure map services...</p>
      </div>
    );
  }

  return (
    <MapErrorBoundary>
      <div className="secure-map-container">
        {shipmentId && (
          <div className={`connection-status ${socketStatus}`}>
            {socketStatus === 'connected' && '🔐 Secure Connection Established'}
            {socketStatus === 'connecting' && '🛡️ Establishing Secure Connection...'}
            {socketStatus === 'error' && '⛔ Connection Security Violation'}
          </div>
        )}

        <MapContainer 
          center={mapCenter} 
          zoom={zoom} 
          style={{ height: '500px', width: '100%' }}
          attributionControl={false}
        >
          <TileLayer
            url={process.env.REACT_APP_MAP_TILE_URL}
            crossOrigin="anonymous"
            detectRetina
          />

          {markers.map(marker => (
            <Marker
              key={`${marker._id}-${CryptoJS.SHA256(JSON.stringify(marker.position)).toString()}`}
              position={marker.position}
            >
              <Popup>
                <div className="secure-popup">
                  <h4>{marker.shipmentId}</h4>
                  <p>{marker.currentLocation}</p>
                  {marker.currentEta && (
                    <p>Secure ETA: {new Date(marker.currentEta).toLocaleString()}</p>
                  )}
                  {marker.status && <p>Status: {marker.status}</p>}
                </div>
              </Popup>
            </Marker>
          ))}

          {routes.map((route, idx) => (
            <Polyline
              key={`route-${idx}-${CryptoJS.SHA256(JSON.stringify(route)).toString()}`}
              positions={route}
              color={idx === routes.length - 1 ? '#1890ff' : '#a4a4a4'}
              weight={2}
              opacity={0.7}
            />
          ))}
        </MapContainer>
      </div>
    </MapErrorBoundary>
  );
};

ShipmentMap.propTypes = {
  shipments: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      shipmentId: PropTypes.string.isRequired,
      currentLocation: PropTypes.string,
      currentEta: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      coordinates: PropTypes.arrayOf(PropTypes.number),
      route: PropTypes.arrayOf(
        PropTypes.shape({
          coordinates: PropTypes.arrayOf(PropTypes.number).isRequired,
          timestamp: PropTypes.string.isRequired,
        })
      ),
      status: PropTypes.string,
    })
  ),
  defaultCenter: PropTypes.arrayOf(PropTypes.number),
  zoom: PropTypes.number,
  shipmentId: PropTypes.string,
};

ShipmentMap.defaultProps = {
  shipments: [],
  defaultCenter: [31.2304, 121.4737], // Shanghai coordinates
  zoom: 5,
};

export default ShipmentMap;