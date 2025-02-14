import axios, { AxiosInstance, AxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';

// Types
export interface LoginResponse {
  success: boolean;
  data: {
    token?: string;
    error?: string;
  };
}

export interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export interface LoginCredentials {
  user_name: string;
  password: string;
}

export interface RegisterData {
  user_name: string;
  password: string;
  name: string;
}

export interface OrderData {
  symbol: string;
  quantity: number;
  price: number;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
}

export interface AccountDetails {
  username: string;
  email: string;
  created_at: string;
  portfolio_value: number;
  portfolio_change: number;
  total_trades: number;
  active_orders: number;
}

export interface WalletData {
  balance: number;
  last_updated: string;
}

export interface StockHolding {
  symbol: string;
  quantity: number;
  average_price: number;
  current_price: number;
  profit_loss: number;
}

export interface Portfolio {
  holdings: StockHolding[];
  total_value: number;
}

export interface Order {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  created_at: string;
  completed_at?: string;
}

interface ErrorResponse {
  error?: string;
}

// API instance
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Error handling utility
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || 'An error occurred while processing your request';
  }
  return 'An unexpected error occurred';
};

// Auth Service
export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      console.log('Login attempt:', {
        username: credentials.user_name,
        timestamp: new Date().toISOString(),
        endpoint: `${API_BASE_URL}/auth/login`
      });

      const response = await api.post('/auth/login', credentials);

      console.log('Raw API Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers,
        timestamp: new Date().toISOString()
      });

      // Check if we have an access_token in the response
      if (response.data.access_token) {
        // Store the token
        localStorage.setItem('token', response.data.access_token);

        console.log('Login successful:', {
          username: credentials.user_name,
          timestamp: new Date().toISOString(),
          tokenReceived: true
        });

        return {
          success: true,
          data: {
            token: response.data.access_token
          }
        };
      }

      console.log('Login failed (no token):', {
        username: credentials.user_name,
        timestamp: new Date().toISOString(),
        responseSuccess: response.data.success,
        responseData: response.data,
        error: response.data.error || 'No error message provided'
      });

      return {
        success: false,
        data: {
          error: response.data.error || 'Invalid username or password'
        }
      };
    } catch (error) {
      const apiError = error as AxiosError<ErrorResponse>;
      console.error('Login error (exception):', {
        username: credentials.user_name,
        timestamp: new Date().toISOString(),
        errorType: apiError?.name,
        errorMessage: apiError?.message,
        apiErrorResponse: apiError?.response?.data,
        stackTrace: apiError?.stack
      });

      return {
        success: false,
        data: {
          error: apiError?.response?.data?.error || 'An error occurred during login'
        }
      };
    }
  },

  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    return response;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },
};

// Account Service
export const accountService = {
  getAccountDetails: async (): Promise<AccountDetails> => {
    const response = await api.get('/account/details');
    return response.data;
  },

  getWalletBalance: async (): Promise<WalletData> => {
    const response = await api.get('/account/wallet');
    return response.data;
  },

  addMoney: async (amount: number): Promise<WalletData> => {
    const response = await api.post('/account/wallet/deposit', { amount });
    return response.data;
  },
};

// Trading Service
export const tradingService = {
  // Stock Management
  createStock: async (stockName: string) => {
    const response = await api.post('/api/stocks/create/', { stock_name: stockName });
    return response;
  },

  addStockToUser: async (stockId: string, quantity: number) => {
    const response = await api.post('/api/stocks/add-to-user/', {
      stock_id: stockId,
      quantity,
    });
    return response;
  },

  getStockPortfolio: async () => {
    const response = await api.get('/api/stocks/portfolio/');
    return response;
  },

  // Order Management
  placeOrder: async (orderData: {
    stock_id: string;
    quantity: number;
    is_buy: boolean;
    order_type: 'MARKET' | 'LIMIT';
    price?: number;
  }) => {
    const response = await api.post('/api/stocks/order/', orderData);
    return response;
  },

  getOrders: async () => {
    const response = await api.get('/api/orders/');
    return response;
  },

  getRecentOrders: async () => {
    const response = await api.get('/api/orders/recent/');
    return response.data;
  },

  cancelOrder: async (orderId: string) => {
    const response = await api.post(`/api/stocks/cancel-transaction/`, {
      stock_tx_id: orderId,
    });
    return response;
  },

  // Wallet Management
  getWallet: async () => {
    const response = await api.get('/api/wallet/');
    return response;
  },

  // Market Data
  getMarketPrices: async () => {
    const response = await api.get('/api/market-prices/');
    return response;
  },
};

export default tradingService; 