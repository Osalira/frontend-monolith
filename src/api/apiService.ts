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
      // Don't log token for security reasons
      console.log(`Request to ${config.url} with auth token`);
    } else {
      console.log(`Request to ${config.url} without auth token`);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  (error: AxiosError) => {
    console.error('API Error:', error.message, 'URL:', error.config?.url, 'Status:', error.response?.status);
    
    // Only redirect to login if we get a 401 from an authenticated endpoint
    // AND we're not already on the login or register page
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // Don't redirect if we're already on login or register page
      if (currentPath !== '/login' && currentPath !== '/register') {
        console.log('Token expired or invalid, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?redirect=' + encodeURIComponent(currentPath);
      } else {
        console.log('Received 401 on auth page, not redirecting');
      }
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
    // Include token in request body and uppercase order_type for Test Run-1 compatibility
    const token = localStorage.getItem('token');
    const payload = {
      token,
      stock_id: orderData.stock_id,
      is_buy: orderData.is_buy,
      order_type: orderData.order_type.toUpperCase(), // Convert to uppercase (MARKET/LIMIT)
      quantity: orderData.quantity,
      price: orderData.price
    };
    console.log('Placing stock order with payload:', payload);
    return api.post('/engine/placeStockOrder', payload);
  },
  
  cancelStockTransaction: async (transactionId: number | string): Promise<AxiosResponse> => {
    console.log(`Cancelling transaction ${transactionId} (${typeof transactionId})`);
    return api.post('/engine/cancelStockTransaction', { transaction_id: transactionId.toString() });
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
    // Include token in request body for Test Run-1 compatibility
    const token = localStorage.getItem('token');
    console.log('Adding money to wallet with token and amount:', { token, amount });
    return api.post('/transaction/addMoneyToWallet', { token, amount });
  },
};

// Admin API (for setup)
export const adminApi = {
  createStock: async (stockData: {
    stock_name: string;
  }): Promise<AxiosResponse> => {
    console.log('Creating stock with data:', stockData);
    return api.post('/setup/createStock', stockData);
  },
  
  addStockToUser: async (data: {
    stock_id: number;
    quantity: number;
  }): Promise<AxiosResponse> => {
    console.log('Adding stock to user with data:', data);
    return api.post('/setup/addStockToUser', data);
  },
};

export default api; 