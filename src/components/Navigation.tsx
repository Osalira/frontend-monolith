import React from 'react';
import { HStack, Link } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { authService } from '../services/apiService';

const Navigation: React.FC = () => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  const isActive = (path: string) => location.pathname === path;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <HStack spacing={8} mx={8}>
      <Link
        as={RouterLink}
        to="/dashboard"
        fontWeight={isActive('/dashboard') ? 'bold' : 'normal'}
        color={isActive('/dashboard') ? 'blue.500' : undefined}
      >
        Dashboard
      </Link>
      <Link
        as={RouterLink}
        to="/trading"
        fontWeight={isActive('/trading') ? 'bold' : 'normal'}
        color={isActive('/trading') ? 'blue.500' : undefined}
      >
        Trading
      </Link>
      <Link
        as={RouterLink}
        to="/orders"
        fontWeight={isActive('/orders') ? 'bold' : 'normal'}
        color={isActive('/orders') ? 'blue.500' : undefined}
      >
        Orders
      </Link>
    </HStack>
  );
};

export default Navigation; 