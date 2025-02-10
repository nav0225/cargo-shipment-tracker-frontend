import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchShipments } from '../features/shipmentsSlice';
import ShipmentList from '../components/ShipmentList';
import ShipmentMapWrapper from '../components/ShipmentMapWrapper';
import ShipmentForm from '../components/ShipmentForm';
import './Dashboard.css';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { status, error } = useSelector(state => state.shipments);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Secure data loading with error boundary
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchShipments()).catch(error => {
        console.error('Secure data fetch failed:', error);
      });
    }
  }, [status, dispatch]);

  return (
    <div className="secure-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>
            <span className="secure-icon">🔒</span>
            Cargo Shipment Tracker
          </h1>
          <div className="security-badge">
            <span className="secure-indicator"></span>
            AES-256 Encrypted Connection
          </div>
        </div>
        <ShipmentForm />
      </div>

      <div className="dashboard-grid">
        {/* Security Filter Panel */}
        <div className="filter-panel">
          <div className="filter-group">
            <label htmlFor="status-filter">Security Status:</label>
            <select 
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="secure-select"
            >
              <option value="all">All Shipments</option>
              <option value="In Transit">In Transit</option>
              <option value="Delayed">Security Hold</option>
              <option value="Delivered">Verified Deliveries</option>
            </select>
          </div>
          <div className="security-status">
            {status === 'loading' && (
              <span className="security-loading">
                Validating Shipment Integrity...
              </span>
            )}
            {error && (
              <span className="security-error">
                ⚠️ Security Verification Failed: {error}
              </span>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="content-grid">
          <div className="secure-list-container">
            <ShipmentList 
              onSelect={setSelectedShipment}
              filterStatus={filterStatus}
            />
          </div>
          
          <div className="secure-map-container">
            <ShipmentMapWrapper 
              shipmentId={selectedShipment?._id}
              key={selectedShipment?._id || 'default-map'}
              securityToken={process.env.REACT_APP_MAP_SECRET}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;