import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authApi = {
  register: async (userData: any): Promise<AxiosResponse> => {
    return api.post('/authentication/register', userData);
  },
  
  login: async (credentials: { username: string; password: string }): Promise<AxiosResponse> => {
    return api.post('/authentication/login', credentials);
  },
  
  getCurrentUser: async (): Promise<AxiosResponse> => {
    return api.get('/authentication/me');
  },
};

// Stock API
export const stockApi = {
  getStockPrices: async (): Promise<AxiosResponse> => {
    return api.get('/transaction/getStockPrices');
  },
  
  getStockPortfolio: async (): Promise<AxiosResponse> => {
    return api.get('/transaction/getStockPortfolio');
  },
  
  getStockTransactions: async (params?: { limit?: number; offset?: number }): Promise<AxiosResponse> => {
    return api.get('/transaction/getStockTransactions', { params });
  },
  
  placeStockOrder: async (orderData: {
    stock_id: number;
    is_buy: boolean;
    order_type: 'Market' | 'Limit';
    quantity: number;
    price?: number;
  }): Promise<AxiosResponse> => {
    return api.post('/engine/placeStockOrder', orderData);
  },
  
  cancelStockTransaction: async (transactionId: number): Promise<AxiosResponse> => {
    return api.post('/engine/cancelStockTransaction', { transaction_id: transactionId });
  },
};

// Wallet API
export const walletApi = {
  getWalletBalance: async (): Promise<AxiosResponse> => {
    return api.get('/transaction/getWalletBalance');
  },
  
  getWalletTransactions: async (params?: { limit?: number; offset?: number }): Promise<AxiosResponse> => {
    return api.get('/transaction/getWalletTransactions', { params });
  },
  
  addMoneyToWallet: async (amount: number): Promise<AxiosResponse> => {
    return api.post('/transaction/addMoneyToWallet', { amount });
  },
};

// Admin API (for setup)
export const adminApi = {
  createStock: async (stockData: {
    symbol: string;
    company_name: string;
    current_price: number;
    total_shares?: number;
    available_shares?: number;
  }): Promise<AxiosResponse> => {
    return api.post('/setup/createStock', stockData);
  },
  
  addStockToUser: async (data: {
    target_user_id: number;
    stock_id: number;
    quantity: number;
    price: number;
  }): Promise<AxiosResponse> => {
    return api.post('/setup/addStockToUser', data);
  },
};

export default api; 