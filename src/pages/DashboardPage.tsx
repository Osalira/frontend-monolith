import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStock } from '../context/StockContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { stocks, portfolio, isLoading, fetchStocks, fetchPortfolio } = useStock();

  useEffect(() => {
    fetchStocks();
    fetchPortfolio();
  }, [fetchStocks, fetchPortfolio]);

  if (isLoading.stocks || isLoading.portfolio) {
    return <LoadingSpinner />;
  }

  // Calculate total portfolio value
  const totalPortfolioValue = portfolio.reduce((total, item) => total + item.total_value, 0);

  // Calculate total profit/loss
  const totalProfitLoss = portfolio.reduce((total, item) => total + item.profit_loss, 0);

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      
      <div className="dashboard-welcome">
        <h2>Welcome, {user?.name || user?.username}</h2>
      </div>
      
      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Portfolio Value</h3>
          <p className="summary-value">${totalPortfolioValue.toFixed(2)}</p>
          <Link to="/portfolio" className="btn btn-link">View Portfolio</Link>
        </div>
        
        <div className="summary-card">
          <h3>Total Profit/Loss</h3>
          <p className={`summary-value ${totalProfitLoss >= 0 ? 'profit' : 'loss'}`}>
            ${totalProfitLoss.toFixed(2)}
          </p>
        </div>
        
        <div className="summary-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <Link to="/trade" className="btn btn-primary">Trade</Link>
            <Link to="/wallet" className="btn btn-secondary">Manage Wallet</Link>
          </div>
        </div>
      </div>
      
      <div className="dashboard-stocks">
        <h3>Latest Stock Prices</h3>
        <div className="stock-list">
          {stocks.length === 0 ? (
            <p>No stocks available</p>
          ) : (
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.slice(0, 5).map((stock) => (
                  <tr key={stock.id}>
                    <td>{stock.symbol}</td>
                    <td>{stock.company_name}</td>
                    <td>${stock.current_price}</td>
                    <td>
                      <Link to={`/trade?stockId=${stock.id}`} className="btn btn-small">
                        Trade
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 