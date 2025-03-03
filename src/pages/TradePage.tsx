import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStock } from '../context/StockContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TradePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const stockIdParam = searchParams.get('stockId');
  const stockSymbolParam = searchParams.get('stockSymbol');
  
  const { stocks, isLoading, fetchStocks, placeOrder } = useStock();
  
  // Add search state
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredStocks, setFilteredStocks] = useState<Array<any>>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [orderData, setOrderData] = useState({
    stock_id: stockIdParam ? parseInt(stockIdParam) : 0,
    is_buy: true,
    order_type: 'Market' as 'Market' | 'Limit',
    quantity: 1,
    price: 0
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  // Set stock by symbol if provided in URL
  useEffect(() => {
    if (stockSymbolParam && stocks.length > 0) {
      const stockWithSymbol = stocks.find(stock => stock.symbol === stockSymbolParam);
      if (stockWithSymbol) {
        setOrderData(prev => ({ ...prev, stock_id: stockWithSymbol.stock_id }));
        setSearchTerm(`${stockWithSymbol.symbol} - ${stockWithSymbol.stock_name || stockWithSymbol.company_name}`);
      }
    }
  }, [stockSymbolParam, stocks]);
  
  // Handle clicks outside the suggestions dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef]);
  
  // Update filtered stocks when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStocks([]);
      return;
    }
    
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = stocks.filter(stock => {
      const symbolMatch = stock.symbol.toLowerCase().includes(lowercasedFilter);
      const nameMatch = (stock.stock_name || stock.company_name || '')
        .toLowerCase()
        .includes(lowercasedFilter);
      return symbolMatch || nameMatch;
    }).slice(0, 10); // Limit to 10 results
    
    setFilteredStocks(filtered);
  }, [searchTerm, stocks]);
  
  // Update price when stock or order type changes
  useEffect(() => {
    if (orderData.stock_id && orderData.order_type === 'Market') {
      const selectedStock = stocks.find(stock => stock.stock_id === orderData.stock_id);
      if (selectedStock) {
        setOrderData(prev => ({ ...prev, price: selectedStock.current_price }));
      }
    }
  }, [orderData.stock_id, orderData.order_type, stocks]);
  
  // Replace handleStockChange with a function to handle stock selection from suggestions
  const handleStockSelect = (stock: any) => {
    setOrderData(prev => ({ ...prev, stock_id: stock.stock_id }));
    setSearchTerm(`${stock.symbol} - ${stock.stock_name || stock.company_name}`);
    setShowSuggestions(false);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
    
    // Clear the selected stock if search input is emptied
    if (e.target.value.trim() === '') {
      setOrderData(prev => ({ ...prev, stock_id: 0 }));
    }
  };
  
  const handleOrderTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orderType = e.target.value as 'Market' | 'Limit';
    setOrderData(prev => ({ ...prev, order_type: orderType }));
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'quantity') {
      const quantity = parseInt(value) || 1;
      setOrderData(prev => ({ ...prev, [name]: quantity }));
    } else if (name === 'price') {
      const price = parseFloat(value) || 0;
      setOrderData(prev => ({ ...prev, [name]: price }));
    } else {
      setOrderData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (!orderData.stock_id) {
      setError('Please select a stock');
      return;
    }
    
    if (orderData.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    
    if (orderData.order_type === 'Limit' && orderData.price <= 0) {
      setError('Price must be greater than 0 for limit orders');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // For market orders, don't send a price - let the matching engine determine it
      const orderPayload = orderData.order_type === 'Market'
        ? { stock_id: orderData.stock_id, is_buy: orderData.is_buy, order_type: orderData.order_type, quantity: orderData.quantity }
        : { ...orderData };
      
      await placeOrder(orderPayload);
      setSuccess(`${orderData.is_buy ? 'Buy' : 'Sell'} order placed successfully`);
      
      // Reset form after successful submission
      setOrderData(prev => ({
        ...prev,
        quantity: 1,
        price: orderData.order_type === 'Market' ? 0 : prev.price
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  if (isLoading.stocks) {
    return <LoadingSpinner />;
  }
  
  const selectedStock = stocks.find(stock => stock.stock_id === orderData.stock_id);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Trade Stocks</h1>
        <p className="text-gray-600 dark:text-gray-300">Place buy and sell orders for stocks</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Place an Order</h2>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
                    </div>
                  </div>
                </div>
              )}
              
              {success && (
                <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800 dark:text-green-300">{success}</h3>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6">
                  {/* Stock Selection - Autocomplete */}
                  <div ref={searchRef} className="relative">
                    <label htmlFor="stock-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search for Stock
                    </label>
                    <div className="relative">
                      <input
                        id="stock-search"
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Type to search for a stock..."
                        className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white pl-3 pr-10 py-2 ${orderData.stock_id > 0 ? 'border-green-300 dark:border-green-600' : 'border-gray-300 dark:border-gray-600'}`}
                        required
                      />
                      {orderData.stock_id > 0 && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {showSuggestions && filteredStocks.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-gray-200 dark:border-gray-700">
                        {filteredStocks.map((stock) => (
                          <li
                            key={stock.stock_id}
                            onClick={() => handleStockSelect(stock)}
                            className={`cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 text-gray-900 dark:text-white ${orderData.stock_id === stock.stock_id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                          >
                            <div className="flex justify-between">
                              <span className="font-medium">{stock.symbol}</span>
                              <span className="text-gray-500 dark:text-gray-400">{formatCurrency(stock.current_price)}</span>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{stock.stock_name || stock.company_name}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                    {searchTerm && filteredStocks.length === 0 && showSuggestions && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md py-2 px-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">No stocks found</p>
                      </div>
                    )}
                    {orderData.stock_id > 0 && (
                      <div className="mt-1 text-sm text-green-600 dark:text-green-400">
                        Selected stock: {selectedStock?.symbol} - {formatCurrency(selectedStock?.current_price || 0)}
                      </div>
                    )}
                  </div>
                  
                  {/* Order Type (Buy/Sell) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Order Type</label>
                    <div className="flex space-x-4">
                      <div className="flex items-center">
                        <input
                          id="buy"
                          name="is_buy"
                          type="radio"
                          checked={orderData.is_buy}
                          onChange={() => setOrderData(prev => ({ ...prev, is_buy: true }))}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600"
                        />
                        <label htmlFor="buy" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Buy
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="sell"
                          name="is_buy"
                          type="radio"
                          checked={!orderData.is_buy}
                          onChange={() => setOrderData(prev => ({ ...prev, is_buy: false }))}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600"
                        />
                        <label htmlFor="sell" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Sell
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price Type (Market/Limit) */}
                  <div>
                    <label htmlFor="order_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price Type</label>
                    <select
                      id="order_type"
                      value={orderData.order_type}
                      onChange={handleOrderTypeChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    >
                      <option value="Market">Market</option>
                      <option value="Limit">Limit</option>
                    </select>
                  </div>
                  
                  {/* Quantity */}
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      min="1"
                      value={orderData.quantity}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                  
                  {/* Price (for Limit orders) */}
                  {orderData.order_type === 'Limit' && (
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Limit Price</label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="price"
                          name="price"
                          min="0.01"
                          step="0.01"
                          value={orderData.price}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting || isLoading.stocks}
                    >
                      {isSubmitting ? 'Processing...' : 'Place Order'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Order Summary</h2>
            </div>
            <div className="p-6">
              {selectedStock ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock</h3>
                    <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                      {selectedStock.symbol} - {selectedStock.company_name}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Price</h3>
                    <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                      {formatCurrency(selectedStock.current_price)}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Details</h3>
                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                      {orderData.is_buy ? 'Buy' : 'Sell'} {orderData.quantity} shares 
                      at {orderData.order_type === 'Market' ? 'market price' : formatCurrency(orderData.price)}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Total</h3>
                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(orderData.quantity * (orderData.order_type === 'Market' ? selectedStock.current_price : orderData.price))}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  Select a stock to see order details
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradePage; 