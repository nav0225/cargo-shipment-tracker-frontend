import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchShipments, 
  selectAllShipments,
  selectShipmentStats 
} from '../features/shipmentsSlice';
import ErrorBoundary from './ErrorBoundary';
import CryptoJS from 'crypto-js';
import './ShipmentList.css';

const ShipmentList = ({ onSelect, filterStatus = 'all', searchQuery = '' }) => {
  const dispatch = useDispatch();
  const allShipments = useSelector(selectAllShipments);
  const stats = useSelector(selectShipmentStats);
  const { status, error } = useSelector(state => state.shipments);

 
  const filteredShipments = useMemo(() => {
    return allShipments.filter(shipment => {
      const statusMatch = filterStatus === 'all' || shipment.status === filterStatus;
      const searchMatch = shipment.shipmentId.toLowerCase().includes(searchQuery.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [allShipments, filterStatus, searchQuery]);

  
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchShipments());
    }
  }, [status, dispatch]);

  // Security status indicator
  const renderStatusIndicator = () => (
    <div className="security-status">
      <span className={`status-dot ${status}`} />
      {status === 'loading' && 'Validating Shipment Data...'}
      {status === 'failed' && 'Security Verification Failed'}
      {status === 'succeeded' && 'Secure Connection Established'}
    </div>
  );

  
  const handleRowClick = (shipment) => {
    if (typeof onSelect === 'function') {
      onSelect(shipment);
    }
  };

  return (
    <ErrorBoundary fallback={<div className="secure-error">Shipment Data Unavailable</div>}>
      <div className="secure-shipment-list">
        <div className="list-header">
          <h2>Secure Shipment Registry</h2>
          {renderStatusIndicator()}
        </div>

        {status === 'failed' ? (
          <div className="secure-error-panel">
            <h3>Data Integrity Alert</h3>
            <p>{CryptoJS.XSS.escape(error)}</p>
            <button 
              className="retry-button"
              onClick={() => dispatch(fetchShipments())}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Reconnecting...' : 'Retry with Secure Connection'}
            </button>
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="no-data">
            <p>No verified shipments found</p>
            <small>All shipments undergo security validation</small>
          </div>
        ) : (
          <>
            <div className="security-stats">
              <div className="stat-item">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total Shipments</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats['In Transit'] || 0}</span>
                <span className="stat-label">In Transit</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.Delayed || 0}</span>
                <span className="stat-label">Delayed</span>
              </div>
            </div>

            <div className="responsive-table">
              <table className="secure-table">
                <thead>
                  <tr>
                    <th>Shipment ID</th>
                    <th>Container ID</th>
                    <th>Current Location</th>
                    <th>Verified ETA</th>
                    <th>Security Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShipments.map((shipment) => (
                    <tr 
                      key={CryptoJS.SHA256(shipment._id).toString()}
                      onClick={() => handleRowClick(shipment)}
                      className="secure-row"
                    >
                      <td data-label="Shipment ID">{shipment.shipmentId}</td>
                      <td data-label="Container ID">{shipment.containerId}</td>
                      <td data-label="Location">
                        {CryptoJS.XSS.escape(shipment.currentLocation)}
                      </td>
                      <td data-label="ETA">
                        {new Date(shipment.currentEta).toLocaleString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZoneName: 'short'
                        })}
                      </td>
                      <td data-label="Status">
                        <span className={`status-badge ${shipment.status}`}>
                          {shipment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

ShipmentList.propTypes = {
  onSelect: PropTypes.func,
  filterStatus: PropTypes.string,
  searchQuery: PropTypes.string,
};

export default ShipmentList;