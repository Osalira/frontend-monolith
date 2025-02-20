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
  RadioGroup,
  Radio,
  HStack,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { authService, handleApiError } from '../services/apiService';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    user_name: '',
    password: '',
    name: '',
    account_type: 'user' as 'user' | 'company'
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const toast = useToast();
  const navigate = useNavigate();

  const registerMutation = useMutation(
    (data: typeof formData) => authService.register(data),
    {
      onSuccess: () => {
        toast({
          title: 'Registration successful',
          description: 'Please sign in with your new account',
          status: 'success',
          duration: 3000,
        });
        navigate('/login');
      },
      onError: (error: any) => {
        toast({
          title: 'Registration failed',
          description: handleApiError(error),
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
    if (!formData.name) newErrors.name = 'Name is required';
    if (formData.user_name.length < 3) {
      newErrors.user_name = 'Username must be at least 3 characters';
    }
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

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
      registerMutation.mutate(formData);
    }
  };

  return (
    <Container maxW="container.sm" py={8}>
      <VStack spacing={8}>
        <Heading>Create Account</Heading>
        
        <Box as="form" w="100%" onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Account Type</FormLabel>
              <RadioGroup
                value={formData.account_type}
                onChange={(value: 'user' | 'company') => 
                  setFormData(prev => ({ ...prev, account_type: value }))}
              >
                <HStack spacing={4}>
                  <Radio value="user" data-cy="account-type-user">Individual User</Radio>
                  <Radio value="company" data-cy="account-type-company">Company</Radio>
                </HStack>
              </RadioGroup>
            </FormControl>

            <FormControl isInvalid={!!errors.user_name}>
              <FormLabel>Username</FormLabel>
              <Input
                type="text"
                name="user_name"
                value={formData.user_name}
                onChange={handleChange}
                placeholder={formData.account_type === 'company' ? "Company username" : "Choose a username"}
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
                placeholder="Create a password"
                data-cy="password-input"
              />
              <FormErrorMessage>{errors.password}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.name}>
              <FormLabel>{formData.account_type === 'company' ? 'Company Name' : 'Full Name'}</FormLabel>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={formData.account_type === 'company' ? "Enter company name" : "Enter your name"}
                data-cy="name-input"
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              width="100%"
              mt={4}
              isLoading={registerMutation.isLoading}
              data-cy="register-submit"
            >
              Create Account
            </Button>
          </VStack>
        </Box>

        <Text>
          Already have an account?{' '}
          <Link as={RouterLink} to="/login" color="blue.500" data-cy="login-link">
            Sign in
          </Link>
        </Text>
      </VStack>
    </Container>
  );
};

export default Register; 