import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
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
  
  // Fetch stock prices - using useCallback to memoize the function
  const fetchStocks = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, stocks: true }));
      const response = await stockApi.getStockPrices();
      
      console.log('Stock prices response:', response.data);
      
      // Handle the standard response format
      if (response.data && response.data.success === true) {
        // The data property might contain the array directly or another nested object
        const responseData = response.data.data;
        
        if (Array.isArray(responseData)) {
          setStocks(responseData);
        } else {
          console.error('Unexpected stocks data format:', responseData);
          setStocks([]);
        }
      } else if (Array.isArray(response.data)) {
        // Fallback for direct array responses
        setStocks(response.data);
      } else {
        console.error('Invalid stocks response format:', response.data);
        setStocks([]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch stock prices');
      console.error('Error fetching stocks:', error);
      setStocks([]);
    } finally {
      setIsLoading(prev => ({ ...prev, stocks: false }));
    }
  }, []);
  
  // Fetch portfolio - using useCallback to memoize the function
  const fetchPortfolio = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(prev => ({ ...prev, portfolio: true }));
      const response = await stockApi.getStockPortfolio();
      
      console.log('Portfolio response:', response.data);
      
      // Handle the standard response format
      if (response.data && response.data.success === true) {
        const responseData = response.data.data;
        
        if (Array.isArray(responseData)) {
          // Direct array of portfolio items
          setPortfolio(responseData);
        } else if (responseData && typeof responseData === 'object') {
          // It might be an object with a portfolio property or other structure
          if (Array.isArray(responseData.portfolio)) {
            setPortfolio(responseData.portfolio);
          } else if (responseData.portfolio && typeof responseData.portfolio === 'object') {
            // Single portfolio item as an object
            setPortfolio([responseData.portfolio]);
          } else {
            console.error('Unexpected portfolio data format:', responseData);
            setPortfolio([]);
          }
        } else {
          console.error('Invalid portfolio data format:', responseData);
          setPortfolio([]);
        }
      } else {
        console.error('Invalid portfolio response format:', response.data);
        setPortfolio([]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch portfolio');
      console.error('Error fetching portfolio:', error);
      setPortfolio([]);
    } finally {
      setIsLoading(prev => ({ ...prev, portfolio: false }));
    }
  }, [isAuthenticated]);
  
  // Fetch transactions - using useCallback to memoize the function
  const fetchTransactions = useCallback(async (params?: { limit?: number; offset?: number }) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(prev => ({ ...prev, transactions: true }));
      const response = await stockApi.getStockTransactions(params);
      
      console.log('Transactions response:', response.data);
      
      // Handle the standard response format
      if (response.data && response.data.success === true) {
        const responseData = response.data.data;
        
        if (responseData && Array.isArray(responseData.transactions)) {
          // Nested transactions array
          setTransactions(responseData.transactions);
        } else if (Array.isArray(responseData)) {
          // Direct array of transactions
          setTransactions(responseData);
        } else {
          console.error('Unexpected transactions data format:', responseData);
          setTransactions([]);
        }
      } else if (response.data && Array.isArray(response.data.transactions)) {
        // Legacy format with transactions at top level
        setTransactions(response.data.transactions);
      } else {
        console.error('Invalid transactions response format:', response.data);
        setTransactions([]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch transactions');
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(prev => ({ ...prev, transactions: false }));
    }
  }, [isAuthenticated]);
  
  // Place order - using useCallback to memoize the function
  const placeOrder = useCallback(async (orderData: {
    stock_id: number;
    is_buy: boolean;
    order_type: 'Market' | 'Limit';
    quantity: number;
    price?: number;
  }) => {
    try {
      const response = await stockApi.placeStockOrder(orderData);
      
      console.log('Place order response:', response.data);
      
      // Check if the response was successful
      if (response.data && response.data.success === true) {
        // Refresh data
        fetchPortfolio();
        fetchTransactions();
        
        toast.success(`${orderData.is_buy ? 'Buy' : 'Sell'} order placed successfully`);
        return response.data.data;
      } else {
        const errorMsg = response.data?.error || 'Order placement failed';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to place order');
      console.error('Error placing order:', error);
      throw error;
    }
  }, [fetchPortfolio, fetchTransactions]);
  
  // Cancel order - using useCallback to memoize the function
  const cancelOrder = useCallback(async (transactionId: number) => {
    try {
      const response = await stockApi.cancelStockTransaction(transactionId);
      
      console.log('Cancel order response:', response.data);
      
      // Check if the response was successful
      if (response.data && response.data.success === true) {
        // Refresh transactions
        fetchTransactions();
        
        toast.success('Order cancelled successfully');
        return response.data.data;
      } else {
        const errorMsg = response.data?.error || 'Order cancellation failed';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel order');
      console.error('Error cancelling order:', error);
      throw error;
    }
  }, [fetchTransactions]);
  
  // Fetch stock prices on mount and periodically
  useEffect(() => {
    fetchStocks();
    
    // Refresh stock prices every 30 seconds
    const stocksInterval = setInterval(fetchStocks, 30000);
    
    return () => {
      clearInterval(stocksInterval);
    };
  }, [fetchStocks]);
  
  // Fetch portfolio and transactions when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPortfolio();
      fetchTransactions();
    }
  }, [isAuthenticated, fetchPortfolio, fetchTransactions]);
  
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