import React from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';

const Footer: React.FC = () => {
  // const { isAuthenticated } = useAuth();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* <div>
            <h3 className="text-lg font-semibold mb-4">Day Trading Platform</h3>
            <p className="text-gray-300">
              Your trusted platform for all your trading needs. Fast, secure, and reliable.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to={isAuthenticated ? "/dashboard" : "/login"} className="text-gray-300 hover:text-white">Dashboard</Link></li>
              <li><Link to="/login" className="text-gray-300 hover:text-white">Login</Link></li>
              <li><Link to="/register" className="text-gray-300 hover:text-white">Register</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li><Link to="/trade" className="text-gray-300 hover:text-white">Trading</Link></li>
              <li><Link to="/portfolio" className="text-gray-300 hover:text-white">Portfolio Management</Link></li>
              <li><Link to="/wallet" className="text-gray-300 hover:text-white">Wallet Services</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <p className="text-gray-300">support@daytrading.com</p>
            <p className="text-gray-300">+1 (123) 456-7890</p>
          </div> */}
        </div>
        
        <div className="border-t border-gray-700 pt-6 mt-6 text-center text-gray-300 text-sm">
          <p>&copy; {currentYear} Day Trading Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 