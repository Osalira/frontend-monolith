import React from 'react';
import { Box, Text, Container } from '@chakra-ui/react';

const Footer: React.FC = () => {
  return (
    <Box as="footer" py={4} bg="gray.100" mt="auto">
      <Container maxW="container.xl">
        <Text textAlign="center" fontSize="sm" color="gray.600">
          © {new Date().getFullYear()} Day Trading System - SENG 468 Project
        </Text>
      </Container>
    </Box>
  );
};

export default Footer; 