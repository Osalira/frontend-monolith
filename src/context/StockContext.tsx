import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { stockApi } from '../api/apiService';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

// Types
export interface Stock {
  id?: number;
  stock_id: number;
  symbol: string;
  company_name?: string;
  stock_name: string;
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
  stock_tx_id?: number;
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
          // Map the response to our Stock interface, ensuring backward compatibility
          const stocksData = responseData.map(stock => ({
            id: stock.stock_id, // Map stock_id to id for backward compatibility
            stock_id: Number(stock.stock_id),
            symbol: stock.symbol,
            company_name: stock.stock_name || stock.company_name, // Map stock_name to company_name for backward compatibility
            stock_name: stock.stock_name || stock.company_name,
            current_price: Number(stock.current_price) || 0,
            updated_at: stock.updated_at || new Date().toISOString()
          }));
          console.log('Processed stocks data:', stocksData);
          setStocks(stocksData);
        } else {
          console.error('Unexpected stocks data format:', responseData);
          setStocks([]);
        }
      } else if (Array.isArray(response.data)) {
        // Fallback for direct array responses
        const stocksData = response.data.map(stock => ({
          id: stock.stock_id || stock.id,
          stock_id: Number(stock.stock_id || stock.id),
          symbol: stock.symbol,
          company_name: stock.stock_name || stock.company_name,
          stock_name: stock.stock_name || stock.company_name,
          current_price: Number(stock.current_price) || 0,
          updated_at: stock.updated_at || new Date().toISOString()
        }));
        console.log('Processed stocks data (direct array):', stocksData);
        setStocks(stocksData);
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
          // Map backend fields to match frontend interface
          const mappedPortfolio = responseData.map((item: any) => ({
            ...item,
            // Map quantity_owned to quantity for consistency
            quantity: item.quantity_owned || item.quantity || 0,
            // Ensure other required fields exist
            stock_symbol: item.stock_symbol || '',
            stock_name: item.stock_name || '',
            average_price: Number(item.average_price) || 0,
            current_price: Number(item.current_price) || 0,
            total_value: Number(item.total_value) || 0,
            profit_loss: Number(item.profit_loss) || 0,
            profit_loss_percentage: Number(item.profit_loss_percentage) || 0
          }));
          console.log('Mapped portfolio data:', mappedPortfolio);
          setPortfolio(mappedPortfolio);
        } else if (responseData && typeof responseData === 'object') {
          // It might be an object with a portfolio property or other structure
          if (Array.isArray(responseData.portfolio)) {
            // Map backend fields to match frontend interface
            const mappedPortfolio = responseData.portfolio.map((item: any) => ({
              ...item,
              // Map quantity_owned to quantity for consistency
              quantity: item.quantity_owned || item.quantity || 0,
              // Ensure other required fields exist
              stock_symbol: item.stock_symbol || '',
              stock_name: item.stock_name || '',
              average_price: Number(item.average_price) || 0,
              current_price: Number(item.current_price) || 0,
              total_value: Number(item.total_value) || 0,
              profit_loss: Number(item.profit_loss) || 0,
              profit_loss_percentage: Number(item.profit_loss_percentage) || 0
            }));
            console.log('Mapped portfolio data (from object.portfolio):', mappedPortfolio);
            setPortfolio(mappedPortfolio);
          } else if (responseData.portfolio && typeof responseData.portfolio === 'object') {
            // Single portfolio item as an object
            const item: any = responseData.portfolio;
            const mappedItem = {
              ...item,
              // Map quantity_owned to quantity for consistency
              quantity: item.quantity_owned || item.quantity || 0,
              // Ensure other required fields exist
              stock_symbol: item.stock_symbol || '',
              stock_name: item.stock_name || '',
              average_price: Number(item.average_price) || 0,
              current_price: Number(item.current_price) || 0,
              total_value: Number(item.total_value) || 0,
              profit_loss: Number(item.profit_loss) || 0,
              profit_loss_percentage: Number(item.profit_loss_percentage) || 0
            };
            console.log('Mapped single portfolio item:', mappedItem);
            setPortfolio([mappedItem]);
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
        
        let transactionsData = [];
        
        if (responseData && Array.isArray(responseData.transactions)) {
          // Nested transactions array
          transactionsData = responseData.transactions;
        } else if (Array.isArray(responseData)) {
          // Direct array of transactions
          transactionsData = responseData;
        } else {
          console.error('Unexpected transactions data format:', responseData);
          setTransactions([]);
          return;
        }
        
        // Map and normalize transaction data to ensure consistency
        const processedTransactions = transactionsData.map((tx: any) => {
          // Find the corresponding stock to get its symbol if not provided
          const stockId = Number(tx.stock_id);
          const matchingStock = stocks.find(s => s.stock_id === stockId);
          const stockSymbol = tx.stock_symbol || (matchingStock ? matchingStock.symbol : `Stock-${stockId}`);
          
          // Map API response fields to our interface
          return {
            id: tx.id || tx.stock_tx_id || 0, // Fall back to stock_tx_id if id is not present
            stock_tx_id: tx.stock_tx_id, // Keep the original stock_tx_id
            user_id: Number(tx.user_id) || 0,
            stock: stockId || tx.stock || 0,
            stock_symbol: stockSymbol,
            is_buy: tx.is_buy === true || tx.is_buy === 'true' || false,
            order_type: tx.order_type || '',
            status: tx.status || tx.order_status || 'Pending', // Map order_status to status
            quantity: Number(tx.quantity) || 0,
            price: Number(tx.price || tx.stock_price) || 0,
            timestamp: tx.timestamp || new Date().toISOString(),
            parent_id: tx.parent_id || tx.parent_stock_tx_id || undefined,
            wallet_transaction_id: tx.wallet_transaction_id || tx.wallet_tx_id || undefined
          };
        });
        
        console.log('Processed transactions:', processedTransactions);
        setTransactions(processedTransactions);
      } else {
        console.error('Failed to fetch transactions:', response.data);
        setTransactions([]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch transactions');
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(prev => ({ ...prev, transactions: false }));
    }
  }, [isAuthenticated, stocks]);
  
  // Place order - using useCallback to memoize the function
  const placeOrder = useCallback(async (orderData: {
    stock_id: number;
    is_buy: boolean;
    order_type: 'Market' | 'Limit';
    quantity: number;
    price?: number;
  }) => {
    try {
      // Log the order data being sent
      console.log('Placing order with data:', orderData);
      
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
      console.log(`Attempting to cancel transaction ID: ${transactionId}`);
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