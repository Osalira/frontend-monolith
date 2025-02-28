import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-page">
      <section className="hero">
        <h1>Welcome to Day Trading Platform</h1>
        <p>Your one-stop solution for stock trading and portfolio management</p>
        
        {!isAuthenticated && (
          <div className="hero-buttons">
            <Link to="/login" className="btn btn-primary">Login</Link>
            <Link to="/register" className="btn btn-secondary">Register</Link>
          </div>
        )}
        
        {isAuthenticated && (
          <div className="hero-buttons">
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          </div>
        )}
      </section>
      
      <section className="features">
        <h2>Platform Features</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Real-time Trading</h3>
            <p>Buy and sell stocks with real-time market updates</p>
          </div>
          <div className="feature-card">
            <h3>Portfolio Management</h3>
            <p>Easily track and manage your investment portfolio</p>
          </div>
          <div className="feature-card">
            <h3>Transaction History</h3>
            <p>Comprehensive history of all your trading activities</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 