import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
         
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} Day Trading Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 