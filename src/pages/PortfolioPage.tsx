import React, { useEffect } from 'react';
import { useStock } from '../context/StockContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PortfolioPage: React.FC = () => {
  const { portfolio, isLoading, fetchPortfolio } = useStock();

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  if (isLoading.portfolio) {
    return <LoadingSpinner />;
  }

  return (
    <div className="portfolio-page">
      <h1>My Portfolio</h1>
      {portfolio.length === 0 ? (
        <p>You don't have any stocks in your portfolio yet.</p>
      ) : (
        <div className="portfolio-list">
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>Avg. Price</th>
                <th>Current Price</th>
                <th>Total Value</th>
                <th>Profit/Loss</th>
                <th>P/L %</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((item) => (
                <tr key={item.stock_symbol}>
                  <td>{item.stock_symbol}</td>
                  <td>{item.stock_name}</td>
                  <td>{item.quantity}</td>
                  <td>${item.average_price.toFixed(2)}</td>
                  <td>${item.current_price.toFixed(2)}</td>
                  <td>${item.total_value.toFixed(2)}</td>
                  <td className={item.profit_loss >= 0 ? 'profit' : 'loss'}>
                    ${item.profit_loss.toFixed(2)}
                  </td>
                  <td className={item.profit_loss_percentage >= 0 ? 'profit' : 'loss'}>
                    {item.profit_loss_percentage.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage; 