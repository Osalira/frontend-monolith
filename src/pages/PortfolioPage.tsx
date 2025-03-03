import React from 'react';
import { useStock } from '../context/StockContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

const PortfolioPage: React.FC = () => {
  const { portfolio, isLoading } = useStock();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading.portfolio) {
    return <LoadingSpinner />;
  }

  // Calculate portfolio summary data
  const totalValue = portfolio.reduce((sum, item) => sum + (item.total_value || 0), 0);
  const totalProfitLoss = portfolio.reduce((sum, item) => sum + (item.profit_loss || 0), 0);
  const totalProfitLossPercentage = totalValue ? (totalProfitLoss / (totalValue - totalProfitLoss)) * 100 : 0;

  // Handle empty portfolio
  if (!portfolio || portfolio.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Your Portfolio</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">You don't have any stocks in your portfolio yet.</p>
          <Link to="/trade" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            Start Trading
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Your Portfolio</h1>
        <p className="text-gray-600 dark:text-gray-300">Track your investments and performance</p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">Total Value</h2>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalValue)}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">Total Profit/Loss</h2>
          <p className={`text-3xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalProfitLoss)}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">Return</h2>
          <p className={`text-3xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalProfitLossPercentage.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Portfolio Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Holdings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Avg. Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Current Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Value</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Profit/Loss</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Return %</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {portfolio.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{item.stock_symbol}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.stock_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatCurrency(item.average_price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatCurrency(item.current_price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(item.total_value)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${item.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(item.profit_loss)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${item.profit_loss_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.profit_loss_percentage.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link 
                      to={`/trade?stockSymbol=${item.stock_symbol}`} 
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Trade
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage; 