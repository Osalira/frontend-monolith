import React, { createContext, useState, useEffect, useContext } from 'react';
import { authApi } from '../api/apiService';
import { toast } from 'react-toastify';

// User type definition
export interface User {
  id: number;
  username: string;
  account_type: string;
  name?: string;
  email?: string;
  company_name?: string;
  business_registration?: string;
  company_email?: string;
}

// Auth context type definition
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          console.log('Found stored token and user data');
          setToken(storedToken);
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            console.log('Logged in as:', userData.username);
          } catch (e) {
            console.error('Failed to parse stored user data:', e);
            // Invalid user data, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else {
          console.log('No stored authentication found');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login({ username, password });
      
      // Handle nested response structure
      const responseData = response.data;
      
      // The API returns a nested structure with 'data' containing the actual response
      if (responseData.success && responseData.data) {
        const { token, account } = responseData.data;
        
        if (!token) {
          throw new Error('Token not found in response');
        }
        
        // Save token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(account));
        
        setToken(token);
        setUser(account);
        
        console.log('Login successful, user data:', account);
        toast.success('Login successful');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(userData);
      
      // Handle nested response structure
      const responseData = response.data;
      
      // The API returns a nested structure with 'data' containing the actual response
      if (responseData.success && responseData.data) {
        const { token, account } = responseData.data;
        
        if (!token) {
          throw new Error('Token not found in response');
        }
        
        // Save token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(account));
        
        setToken(token);
        setUser(account);
        
        toast.success('Registration successful');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.info('You have been logged out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;