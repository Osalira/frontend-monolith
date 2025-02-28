import React, { createContext, useState, useEffect, useContext } from 'react';
import { stockApi } from '../api/apiService';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

// Types
export interface Stock {
  id: number;
  symbol: string;
  company_name: string;
  current_price: number;
  updated_at: string;
}

export interface PortfolioItem {
  stock_symbol: string;
  stock_name: string;
  quantity: number;
  average_price: number;
  current_price: number;
  total_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
}

export interface StockTransaction {
  id: number;
  user_id: number;
  stock: number;
  stock_symbol: string;
  is_buy: boolean;
  order_type: string;
  status: string;
  quantity: number;
  price: number;
  timestamp: string;
  parent_id?: number;
  wallet_transaction_id?: number;
}

// Context Type
interface StockContextType {
  stocks: Stock[];
  portfolio: PortfolioItem[];
  transactions: StockTransaction[];
  isLoading: {
    stocks: boolean;
    portfolio: boolean;
    transactions: boolean;
  };
  fetchStocks: () => Promise<void>;
  fetchPortfolio: () => Promise<void>;
  fetchTransactions: (params?: { limit?: number; offset?: number }) => Promise<void>;
  placeOrder: (orderData: {
    stock_id: number;
    is_buy: boolean;
    order_type: 'Market' | 'Limit';
    quantity: number;
    price?: number;
  }) => Promise<any>;
  cancelOrder: (transactionId: number) => Promise<any>;
}

// Create Context
const StockContext = createContext<StockContextType>({
  stocks: [],
  portfolio: [],
  transactions: [],
  isLoading: {
    stocks: false,
    portfolio: false,
    transactions: false,
  },
  fetchStocks: async () => {},
  fetchPortfolio: async () => {},
  fetchTransactions: async () => {},
  placeOrder: async () => ({}),
  cancelOrder: async () => ({}),
});

// Provider Component
export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  
  const [isLoading, setIsLoading] = useState({
    stocks: false,
    portfolio: false,
    transactions: false,
  });
  
  // Fetch stock prices
  const fetchStocks = async () => {
    try {
      setIsLoading(prev => ({ ...prev, stocks: true }));
      const response = await stockApi.getStockPrices();
      setStocks(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch stock prices');
      console.error('Error fetching stocks:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, stocks: false }));
    }
  };
  
  // Fetch portfolio
  const fetchPortfolio = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(prev => ({ ...prev, portfolio: true }));
      const response = await stockApi.getStockPortfolio();
      setPortfolio(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch portfolio');
      console.error('Error fetching portfolio:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, portfolio: false }));
    }
  };
  
  // Fetch transactions
  const fetchTransactions = async (params?: { limit?: number; offset?: number }) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(prev => ({ ...prev, transactions: true }));
      const response = await stockApi.getStockTransactions(params);
      setTransactions(response.data.transactions);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch transactions');
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, transactions: false }));
    }
  };
  
  // Place order
  const placeOrder = async (orderData: {
    stock_id: number;
    is_buy: boolean;
    order_type: 'Market' | 'Limit';
    quantity: number;
    price?: number;
  }) => {
    try {
      const response = await stockApi.placeStockOrder(orderData);
      
      // Refresh data
      fetchPortfolio();
      fetchTransactions();
      
      toast.success(`${orderData.is_buy ? 'Buy' : 'Sell'} order placed successfully`);
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to place order');
      console.error('Error placing order:', error);
      throw error;
    }
  };
  
  // Cancel order
  const cancelOrder = async (transactionId: number) => {
    try {
      const response = await stockApi.cancelStockTransaction(transactionId);
      
      // Refresh transactions
      fetchTransactions();
      
      toast.success('Order cancelled successfully');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel order');
      console.error('Error cancelling order:', error);
      throw error;
    }
  };
  
  // Fetch stock prices on mount and periodically
  useEffect(() => {
    fetchStocks();
    
    // Refresh stock prices every 30 seconds
    const stocksInterval = setInterval(fetchStocks, 30000);
    
    return () => {
      clearInterval(stocksInterval);
    };
  }, []);
  
  // Fetch portfolio and transactions when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPortfolio();
      fetchTransactions();
    }
  }, [isAuthenticated]);
  
  return (
    <StockContext.Provider
      value={{
        stocks,
        portfolio,
        transactions,
        isLoading,
        fetchStocks,
        fetchPortfolio,
        fetchTransactions,
        placeOrder,
        cancelOrder,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

// Custom hook to use stock context
export const useStock = () => useContext(StockContext);

export default StockContext; 