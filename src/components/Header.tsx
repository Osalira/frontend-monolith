import React from 'react';
import { Box, Flex, Button, Heading } from '@chakra-ui/react';
import { useColorMode } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { authService } from '../services/apiService';
import Navigation from './Navigation';

const Header: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <Box as="header" py={4} px={8} bg={colorMode === 'light' ? 'white' : 'gray.800'} boxShadow="sm">
      <Flex justify="space-between" align="center" maxW="container.xl" mx="auto">
        <Flex align="center">
          <RouterLink to="/">
            <Heading size="md">Day Trading System</Heading>
          </RouterLink>
        </Flex>

        <Navigation />

        <Flex align="center" gap={4}>
          <Button onClick={toggleColorMode} size="sm">
            {colorMode === 'light' ? 'Dark' : 'Light'} Mode
          </Button>
          
          {isAuthenticated ? (
            <Button onClick={handleLogout} size="sm" variant="outline">
              Logout
            </Button>
          ) : (
            <Flex gap={2}>
              <Button as={RouterLink} to="/login" size="sm" variant="outline">
                Login
              </Button>
              <Button as={RouterLink} to="/register" size="sm" colorScheme="blue">
                Register
              </Button>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header; 