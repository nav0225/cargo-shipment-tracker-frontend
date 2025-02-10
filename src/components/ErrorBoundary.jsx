import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CryptoJS from 'crypto-js';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorId: null };
  }

  static getDerivedStateFromError(error) {
    const errorId = CryptoJS.SHA256(`${Date.now()}-${error.message}`).toString();
    console.error('Error Boundary:', { errorId, error });
    return { hasError: true, errorId };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof window.Sentry !== 'undefined') {
      window.Sentry.captureException(error, {
        extra: errorInfo,
        tags: { errorId: this.state.errorId }
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="secure-error-boundary">
          <h3>Secure Component Failure</h3>
          <p>Error ID: {this.state.errorId}</p>
          {this.props.fallback || (
            <button 
              className="retry-button"
              onClick={() => this.setState({ hasError: false })}
            >
              Retry Securely
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
};

export default ErrorBoundary;