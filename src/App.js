import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ShipmentDetails from './pages/ShipmentDetails';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        {/* Secure Navigation Header */}
        <nav className="app-navbar">
          <div className="nav-container">
            <Link to="/" className="nav-brand">
              <img src="/logo.svg" className="nav-logo" alt="Cargo Tracker Logo" />
              <span className="brand-text">CargoTrack Pro</span>
            </Link>
            
            <div className="nav-links">
              <Link to="/" className="nav-link">Dashboard</Link>
              <Link to="/shipments/new" className="nav-link">New Shipment</Link>
              {/* Placeholder for auth */}
              <button className="nav-auth">Login</button>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/shipment/:id" element={<ShipmentDetails />} />
            
            {/* 404 Fallback */}
            <Route path="*" element={
              <div className="not-found">
                <h2>404 - Secure Page Not Found</h2>
                <p>The requested resource could not be verified</p>
                <Link to="/" className="secure-link">Return to Dashboard</Link>
              </div>
            } />
          </Routes>
        </main>

        {/* Security Footer */}
        <footer className="app-footer">
          <div className="footer-container">
            <p className="security-disclaimer">
              🔒 All data transmissions are encrypted using AES-256
            </p>
            <div className="footer-links">
              <Link to="/privacy" className="footer-link">Privacy Policy</Link>
              <Link to="/terms" className="footer-link">Terms of Service</Link>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;