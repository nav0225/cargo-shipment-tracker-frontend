import React from 'react';
import { useDispatch } from 'react-redux';
import { createShipment } from '../features/shipmentsSlice';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import CryptoJS from 'crypto-js';
import './ShipmentForm.css';

// Security Constants
const ID_PATTERN = /^[A-Z]{4}-\d{3,}$/;
const MAX_FORM_SUBMISSIONS = 5; // Per minute
let submissionCount = 0;

const ShipmentForm = () => {
  const dispatch = useDispatch();

  const initialValues = {
    shipmentId: '',
    containerId: '',
    currentLocation: '',
    currentEta: '',
    averageSpeed: 50,
    route: [],
  };

  const validationSchema = Yup.object({
    shipmentId: Yup.string()
      .matches(ID_PATTERN, 'Format: SHIP-123 (4 letters, 3+ digits)')
      .required('Required'),
    containerId: Yup.string()
      .matches(ID_PATTERN, 'Format: CNTR-456 (4 letters, 3+ digits)')
      .required('Required'),
    currentLocation: Yup.string()
      .max(100, 'Max 100 characters')
      .required('Required'),
    currentEta: Yup.date()
      .min(new Date(), 'ETA must be in future')
      .required('Required'),
    averageSpeed: Yup.number()
      .min(10, 'Min 10 knots')
      .max(100, 'Max 100 knots')
      .required('Required'),
    route: Yup.array().of(
      Yup.object().shape({
        coordinates: Yup.array()
          .length(2, 'Must have [lat, lng]')
          .required('Required'),
        timestamp: Yup.date().required('Required')
      })
    )
  });

  const sanitizeInput = (values) => {
    return {
      ...values,
      shipmentId: values.shipmentId.trim().toUpperCase(),
      containerId: values.containerId.trim().toUpperCase(),
      currentLocation: CryptoJS.XSS.escape(values.currentLocation),
    };
  };

  const onSubmit = (values, helpers) => {
    if (submissionCount >= MAX_FORM_SUBMISSIONS) {
      helpers.setStatus({ error: 'Submission rate limit exceeded' });
      helpers.setSubmitting(false);
      return;
    }

    submissionCount++;
    const sanitized = sanitizeInput(values);
    
    dispatch(createShipment({
      ...sanitized,
      secureHash: CryptoJS.SHA256(JSON.stringify(sanitized)).toString()
    }))
      .unwrap()
      .then(() => {
        helpers.setStatus({ success: 'Shipment created securely' });
        helpers.resetForm();
        submissionCount = 0;
      })
      .catch((error) => {
        console.error('Secure Submission Error:', error);
        helpers.setStatus({ 
          error: error.message || 'Secure submission failed' 
        });
      })
      .finally(() => {
        helpers.setSubmitting(false);
      });
  };

  return (
    <div className="shipment-form-container">
      <h2>Secure Shipment Creation</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ isSubmitting, status }) => (
          <Form className="shipment-form">
            {/* Field groups with enhanced security */}
            <div className="form-field-group">
              <div className="form-field">
                <label htmlFor="shipmentId">Shipment ID</label>
                <Field 
                  type="text" 
                  name="shipmentId" 
                  placeholder="SHIP-001"
                  autoComplete="off"
                  maxLength="20"
                />
                <ErrorMessage name="shipmentId" component="div" className="error" />
              </div>

              <div className="form-field">
                <label htmlFor="containerId">Container ID</label>
                <Field 
                  type="text" 
                  name="containerId" 
                  placeholder="CNTR-2024"
                  autoComplete="off"
                  maxLength="20"
                />
                <ErrorMessage name="containerId" component="div" className="error" />
              </div>
            </div>

            {/* Location & ETA Section */}
            <div className="form-field-group">
              <div className="form-field">
                <label htmlFor="currentLocation">Current Location</label>
                <Field 
                  type="text" 
                  name="currentLocation" 
                  placeholder="Shanghai Port" 
                  maxLength="100"
                />
                <ErrorMessage name="currentLocation" component="div" className="error" />
              </div>

              <div className="form-field">
                <label htmlFor="currentEta">ETA</label>
                <Field 
                  type="datetime-local" 
                  name="currentEta"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <ErrorMessage name="currentEta" component="div" className="error" />
              </div>
            </div>

            {/* Security Footer */}
            <div className="form-security-footer">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={isSubmitting ? 'submitting' : ''}
              >
                {isSubmitting ? (
                  <>
                    <span className="secure-spinner" />
                    Securing Submission...
                  </>
                ) : 'Create Shipment'}
              </button>
              
              {status && (
                <div className={`status-alert ${status.success ? 'success' : 'error'}`}>
                  {status.success || status.error}
                  {status.error && (
                    <button 
                      type="button" 
                      className="alert-close"
                      onClick={() => this.setState({ status: null })}
                    >
                      ×
                    </button>
                  )}
                </div>
              )}
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ShipmentForm;