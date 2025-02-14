import React from 'react';
import { Box, Container, Heading, Text, Button, VStack, Image } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { authService } from '../services/apiService';

const Home: React.FC = () => {
  const isAuthenticated = authService.isAuthenticated();

  return (
    <Container maxW="container.xl">
      <VStack spacing={8} py={16} textAlign="center">
        <Heading size="2xl">Welcome to Day Trading System</Heading>
        <Text fontSize="xl" color="gray.600" maxW="container.md">
          A comprehensive platform for managing your stock portfolio, executing trades,
          and tracking your investments in real-time.
        </Text>

        {!isAuthenticated && (
          <Box>
            <Button
              as={RouterLink}
              to="/register"
              colorScheme="blue"
              size="lg"
              mr={4}
            >
              Get Started
            </Button>
            <Button
              as={RouterLink}
              to="/login"
              variant="outline"
              size="lg"
            >
              Sign In
            </Button>
          </Box>
        )}

        {isAuthenticated && (
          <Button
            as={RouterLink}
            to="/dashboard"
            colorScheme="blue"
            size="lg"
          >
            Go to Dashboard
          </Button>
        )}

        <Box mt={12}>
          <Heading size="lg" mb={8}>Key Features</Heading>
          <Box display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={8}>
            <Feature
              title="Real-Time Trading"
              description="Execute trades instantly with real-time market data and order matching."
            />
            <Feature
              title="Portfolio Management"
              description="Track your investments, monitor performance, and manage your wallet."
            />
            <Feature
              title="Advanced Orders"
              description="Place market orders and limit orders with automated execution."
            />
          </Box>
        </Box>
      </VStack>
    </Container>
  );
};

interface FeatureProps {
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({ title, description }) => {
  return (
    <Box p={6} borderWidth={1} borderRadius="lg" textAlign="center">
      <Heading size="md" mb={4}>{title}</Heading>
      <Text color="gray.600">{description}</Text>
    </Box>
  );
};

export default Home; 