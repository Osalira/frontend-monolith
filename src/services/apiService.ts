import axios, { AxiosInstance, AxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';

// Types
export interface LoginResponse {
  success: boolean;
  data: {
    token?: string;
    account_type?: string;
    error?: string;
  };
}

export interface ApiError {
  response?: {
    status?: number;
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
  status: 'PENDING' | 'PARTIALLY_COMPLETE' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  created_at: string;
  completed_at?: string;
  total?: number; // Optional total field for UI display
}

export interface StockCreationData {
  symbol: string;
  name: string;
  initial_price: number;
  total_shares: number;
}

interface ErrorResponse {
  error?: string;
}

// Updated interfaces to match Test Run-1 specifications
export interface OrderRequest {
  token?: string;
  stock_id: string;
  is_buy: boolean;
  order_type: 'MARKET' | 'LIMIT';
  quantity: number;
  price?: number;
}

export interface WalletRequest {
  token: string;
  amount: number;
}

export interface CancelTransactionRequest {
  token: string;
  stock_tx_id: string;
}

export interface StockCreationRequest {
  stock_name: string;
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && error.response?.data?.data?.detail === "Token has expired" && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        authService.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
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
        ...response,
        timestamp: new Date().toISOString()
      });

      // Check if we have a token in the response
      if (response.data.data?.token) {
        // Store the token
        localStorage.setItem('token', response.data.data.token);
        
        // Extract account type from JWT
        const decodedToken = jwtDecode(response.data.data.token);
        const account_type = decodedToken.account_type || 'user';
        localStorage.setItem('account_type', account_type);

        return {
          success: true,
          data: {
            token: response.data.data.token,
            account_type
          }
        };
      }

      console.log('Login failed (no token):', {
        username: credentials.user_name,
        timestamp: new Date().toISOString(),
        responseData: response.data,
        error: 'No access token in response'
      });

      return {
        success: false,
        data: {
          error: 'Invalid username or password'
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
    try {
      console.log('Register attempt:', {
        username: data.user_name,
        timestamp: new Date().toISOString(),
        endpoint: `${API_BASE_URL}/auth/register`
      });
      const response = await api.post('/auth/register', data);
      return response.data;
    } catch (error) {
      const apiError = error as AxiosError<ErrorResponse>;
      if (apiError.response?.status === 409) {
        throw new Error('Username already exists');
      }
      if (apiError.response?.status === 400) {
        throw new Error(apiError.response.data.error || 'Invalid registration data');
      }
      throw handleApiError(error);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  isCompanyAccount: () => {
    const accountType = localStorage.getItem('account_type');
    return accountType === 'company';
  },
};

// Account Service
export const accountService = {
  getAccountDetails: async (): Promise<AccountDetails> => {
    const response = await api.get('/trading/account');
    return response.data;
  },

  getWalletBalance: async (): Promise<WalletData> => {
    const response = await api.get('/trading/wallet/balance');
    return response.data;
  },

  addMoney: async (amount: number): Promise<WalletData> => {
    const response = await api.post('/trading/wallet/deposit', { amount });
    return response.data;
  },
};

// Trading Service
export const tradingService = {
  // Stock Management
  createStock: async (data: StockCreationRequest) => {
    try {
      console.log('Creating stock:', {
        ...data,
        timestamp: new Date().toISOString()
      });

      const response = await api.post('/trading/stocks/create/', data);
      
      if (!response.data.success) {
        throw new Error(response.data.data?.error || 'Failed to create stock');
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to create stock:', {
        error,
        status: (error as ApiError).response?.status,
        data: (error as ApiError).response?.data,
        requestData: data,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  getCompanyStocks: async () => {
    console.log('Fetching company stocks:', {
      endpoint: '/trading/stocks/company/',
      timestamp: new Date().toISOString()
    });

    try {
      const response = await api.get('/trading/stocks/company/');
      
      if (!response.data.success) {
        throw new Error(response.data.data?.error || 'Failed to fetch company stocks');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch company stocks:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        timestamp: new Date().toISOString(),
        stack: error.stack
      });
      
      if (error.response?.status === 404) {
        throw new Error('Company stocks endpoint not found');
      }
      
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error - please check your connection');
      }
      
      throw error;
    }
  },

  addStockToUser: async (stockId: string, quantity: number) => {
    const response = await api.post('/api/stocks/add-to-user/', {
      stock_id: stockId,
      quantity,
    });
    return response;
  },

  getStockPortfolio: async () => {
    const response = await api.get('/trading/portfolio');
    return response.data;
  },

  // Order Management
  placeOrder: async (orderData: OrderRequest) => {
    const response = await api.post('/trading/orders/place/', orderData);
    return response.data;
  },

  getOrders: async () => {
    try {
      console.log('Fetching orders from API...');
      const response = await api.get('/trading/orders');
      console.log('Raw orders response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.data?.error || 'Failed to fetch orders');
      }
      
      // Get the orders array from the paginated response and map to correct structure
      const orders = (response.data.data?.results || []).map((order: any) => ({
        id: order.id,
        symbol: order.stock_name,
        type: order.order_type,
        quantity: order.quantity,
        price: order.price,
        status: order.status,
        created_at: order.created_at,
        completed_at: order.updated_at,
        total: order.quantity * Number(order.price) // Calculate total
      }));
      
      // Sort orders by created_at in descending order
      const sortedOrders = [...orders].sort((a: Order, b: Order) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      console.log('Processed and sorted orders:', sortedOrders);
      return sortedOrders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  getRecentOrders: async () => {
    const response = await api.get('/trading/orders');
    return response.data;
  },

  cancelOrder: async (orderId: string) => {
    const response = await api.post(`/trading/orders/${orderId}/cancel`);
    return response.data;
  },

  // Wallet Management
  addFunds: async (data: WalletRequest) => {
    try {
      // Convert amount to number and validate it's positive
      const amount = Number(data.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Amount must be a positive number');
      }

      const response = await api.post('/trading/wallet/add-money/', {
        token: data.token,
        amount: amount  // Send the converted number
      });
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw handleApiError(error);
    }
  },

  getWalletBalance: async () => {
    try {
      const response = await api.get('/trading/wallet/balance/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Portfolio Management
  getPortfolio: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/trading/portfolio', {
        params: { token }
      });
      // Sort holdings lexicographically by stock name in decreasing order
      const sortedHoldings = response.data.holdings.sort((a: any, b: any) => 
        b.stock_name.localeCompare(a.stock_name)
      );
      return { ...response.data, holdings: sortedHoldings };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Market Data
  getStockPrices: async () => {
    try {
      const response = await api.get('/trading/stocks/prices/');
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Transaction Management
  cancelTransaction: async (txId: string) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Cancelling transaction:', {
        txId,
        timestamp: new Date().toISOString()
      });

      const response = await api.post('/trading/stocks/cancel-transaction', {
        token,
        stock_tx_id: txId
      });

      if (!response.data.success) {
        throw new Error(response.data.data?.error || 'Failed to cancel transaction');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to cancel transaction:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  // Cancel partial orders
  cancelPartialOrders: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/trading/orders/cancel-partial/', { token });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Add cancel transaction method
  cancelStockTransaction: async (orderId: string) => {
    try {
      const response = await api.post('/trading/stocks/cancel-transaction/', {
        stock_tx_id: orderId
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default tradingService; 