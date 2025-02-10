import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ShipmentMapWrapper from '../components/ShipmentMapWrapper';
import './ShipmentDetails.css';

const ShipmentDetails = () => {
  const { id } = useParams();
  const shipment = useSelector(state => 
    state.shipments.shipments.find(s => s._id === id)
  );

  if (!shipment) {
    return <div>Shipment not found</div>;
  }

  return (
    <div className="shipment-details">
      <h2>Shipment Details: {shipment.shipmentId}</h2>
      
      <div className="details-grid">
        <div className="info-section">
          <h3>Current Status</h3>
          <p>Location: {shipment.currentLocation}</p>
          <p>ETA: {new Date(shipment.currentEta).toLocaleString()}</p>
          <p>Status: {shipment.status}</p>
        </div>

        <div className="map-section">
          <ShipmentMapWrapper shipmentId={shipment._id} />
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetails;