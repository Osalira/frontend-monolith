import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStock } from '../context/StockContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TradePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const stockIdParam = searchParams.get('stockId');
  
  const { stocks, isLoading, fetchStocks, placeOrder } = useStock();
  
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
  
  // Update price when stock or order type changes
  useEffect(() => {
    if (orderData.stock_id && orderData.order_type === 'Market') {
      const selectedStock = stocks.find(stock => stock.id === orderData.stock_id);
      if (selectedStock) {
        setOrderData(prev => ({ ...prev, price: selectedStock.current_price }));
      }
    }
  }, [orderData.stock_id, orderData.order_type, stocks]);
  
  const handleStockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stockId = parseInt(e.target.value);
    setOrderData(prev => ({ ...prev, stock_id: stockId }));
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
      await placeOrder(orderData);
      setSuccess(`${orderData.is_buy ? 'Buy' : 'Sell'} order placed successfully`);
      
      // Reset form after successful submission
      setOrderData(prev => ({
        ...prev,
        quantity: 1,
        price: orderData.order_type === 'Market' ? 
          (stocks.find(s => s.id === orderData.stock_id)?.current_price || 0) : 0
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading.stocks) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="trade-page">
      <h1>Trade Stocks</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit} className="trade-form">
        <div className="form-group">
          <label htmlFor="stock">Select Stock</label>
          <select
            id="stock"
            value={orderData.stock_id}
            onChange={handleStockChange}
            required
          >
            <option value="">Select a stock</option>
            {stocks.map(stock => (
              <option key={stock.id} value={stock.id}>
                {stock.symbol} - {stock.company_name} (${stock.current_price})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Order Type</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="is_buy"
                checked={orderData.is_buy}
                onChange={() => setOrderData(prev => ({ ...prev, is_buy: true }))}
              />
              Buy
            </label>
            <label>
              <input
                type="radio"
                name="is_buy"
                checked={!orderData.is_buy}
                onChange={() => setOrderData(prev => ({ ...prev, is_buy: false }))}
              />
              Sell
            </label>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="order_type">Order Type</label>
          <select
            id="order_type"
            value={orderData.order_type}
            onChange={handleOrderTypeChange}
            required
          >
            <option value="Market">Market</option>
            <option value="Limit">Limit</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="quantity">Quantity</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            min="1"
            value={orderData.quantity}
            onChange={handleInputChange}
            required
          />
        </div>
        
        {orderData.order_type === 'Limit' && (
          <div className="form-group">
            <label htmlFor="price">Price</label>
            <input
              type="number"
              id="price"
              name="price"
              min="0.01"
              step="0.01"
              value={orderData.price}
              onChange={handleInputChange}
              required
            />
          </div>
        )}
        
        <div className="form-group">
          <label>Order Summary</label>
          <div className="order-summary">
            <p>
              {orderData.is_buy ? 'Buy' : 'Sell'} {orderData.quantity} shares of{' '}
              {stocks.find(s => s.id === orderData.stock_id)?.symbol || 'selected stock'}{' '}
              at {orderData.order_type === 'Market' ? 'market price' : `$${orderData.price}`}
            </p>
            <p className="total-cost">
              Estimated {orderData.is_buy ? 'cost' : 'proceeds'}: $
              {(orderData.quantity * orderData.price).toFixed(2)}
            </p>
          </div>
        </div>
        
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || isLoading.stocks}
        >
          {isSubmitting ? 'Processing...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
};

export default TradePage; 