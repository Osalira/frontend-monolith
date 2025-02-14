import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  VStack,
  Text,
  Link,
  useToast,
  FormErrorMessage,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { authService, handleApiError, LoginResponse } from '../services/apiService';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    user_name: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const toast = useToast();
  const navigate = useNavigate();

  const loginMutation = useMutation(
    (data: typeof formData) => {
      console.log('Initiating login mutation:', {
        username: data.user_name,
        timestamp: new Date().toISOString(),
        hasPassword: !!data.password
      });
      return authService.login(data);
    },
    {
      onSuccess: (response: LoginResponse) => {
        console.log('Login mutation response:', {
          success: response.success,
          hasToken: !!response.data?.token,
          timestamp: new Date().toISOString(),
          responseData: response.data
        });

        if (response.success && response.data?.token) {
          console.log('Login successful:', { 
            username: formData.user_name,
            timestamp: new Date().toISOString(),
            message: 'User successfully authenticated',
            redirectingTo: '/dashboard'
          });
          toast({
            title: 'Login successful',
            description: 'Welcome back!',
            status: 'success',
            duration: 3000,
          });
          navigate('/dashboard');
        } else {
          const errorMessage = response.data?.error || 'Authentication failed';
          console.error('Login failed:', { 
            username: formData.user_name, 
            error: errorMessage,
            timestamp: new Date().toISOString(),
            details: 'Authentication failed',
            responseData: response.data,
            validationState: {
              hasUsername: !!formData.user_name,
              hasPassword: !!formData.password,
              formErrors: errors
            },
            suggestedAction: 'Please verify your credentials or contact support if the issue persists'
          });
          toast({
            title: 'Login failed',
            description: errorMessage,
            status: 'error',
            duration: 5000,
          });
        }
      },
      onError: (error: any) => {
        const errorMessage = handleApiError(error);
        const backendError = error.response?.data?.error || errorMessage;
        console.error('Login error:', { 
          username: formData.user_name, 
          error: backendError,
          timestamp: new Date().toISOString(),
          errorDetails: {
            status: error.response?.status,
            statusText: error.response?.statusText,
            serverMessage: error.response?.data?.error,
            originalError: error.message,
            stack: error.stack
          },
          requestInfo: {
            endpoint: '/auth/login',
            method: 'POST',
            attemptedWith: formData.user_name,
            validationState: {
              hasUsername: !!formData.user_name,
              hasPassword: !!formData.password,
              formErrors: errors
            }
          },
          suggestedAction: 'Check network connection and credentials. If the issue persists, the server might be unavailable.'
        });
        toast({
          title: 'Login failed',
          description: backendError,
          status: 'error',
          duration: 5000,
        });
      },
    }
  );

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.user_name) newErrors.user_name = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      loginMutation.mutate(formData);
    }
  };

  return (
    <Container maxW="container.sm" py={8}>
      <VStack spacing={8}>
        <Heading>Sign In</Heading>
        
        <Box as="form" w="100%" onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.user_name}>
              <FormLabel>Username</FormLabel>
              <Input
                type="text"
                name="user_name"
                value={formData.user_name}
                onChange={handleChange}
                placeholder="Enter your username"
                data-cy="username-input"
              />
              <FormErrorMessage>{errors.user_name}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.password}>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                data-cy="password-input"
              />
              <FormErrorMessage>{errors.password}</FormErrorMessage>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              width="100%"
              mt={4}
              isLoading={loginMutation.isLoading}
              data-cy="login-submit"
            >
              Sign In
            </Button>
          </VStack>
        </Box>

        <Text>
          Don't have an account?{' '}
          <Link as={RouterLink} to="/register" color="blue.500" data-cy="register-link">
            Create one
          </Link>
        </Text>
      </VStack>
    </Container>
  );
};

export default Login; 