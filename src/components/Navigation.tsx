import React from 'react';
import { HStack, Link } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { authService } from '../services/apiService';

const Navigation: React.FC = () => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const isCompany = authService.isCompanyAccount();

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
      {isCompany && (
        <Link
          as={RouterLink}
          to="/company/stocks"
          fontWeight={isActive('/company/stocks') ? 'bold' : 'normal'}
          color={isActive('/company/stocks') ? 'blue.500' : undefined}
          data-cy="company-stocks-link"
        >
          Manage Stocks
        </Link>
      )}
      <Link
        as={RouterLink}
        to="/account"
        fontWeight={isActive('/account') ? 'bold' : 'normal'}
        color={isActive('/account') ? 'blue.500' : undefined}
        data-cy="account-link"
      >
        Account
      </Link>
    </HStack>
  );
};

export default Navigation; 