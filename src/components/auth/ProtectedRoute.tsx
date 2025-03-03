import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // Log auth state for debugging
  console.log('Protected route check:', { 
    path: location.pathname,
    isAuthenticated, 
    isLoading 
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Don't redirect if already on login or register page
  const currentPath = location.pathname;
  if (currentPath === '/login' || currentPath === '/register') {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    // Redirect to login page and save the location they tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 