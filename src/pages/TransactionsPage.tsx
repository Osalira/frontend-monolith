import React, { useState, useEffect } from 'react';
import { useStock } from '../context/StockContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TransactionsPage: React.FC = () => {
  const { transactions, isLoading, fetchTransactions } = useStock();
  const [pageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Fetch transactions when component mounts or when page changes
  useEffect(() => {
    fetchTransactions({
      offset: (currentPage - 1) * pageSize,
      limit: pageSize
    });
  }, [fetchTransactions, currentPage, pageSize]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'status-completed';
      case 'Pending':
        return 'status-pending';
      case 'Partially_complete':
        return 'status-partial';
      case 'Cancelled':
        return 'status-cancelled';
      case 'Rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };
  
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };
  
  if (isLoading.transactions) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="transactions-page">
      <h1>Transaction History</h1>
      
      {transactions.length === 0 ? (
        <p>No transactions found</p>
      ) : (
        <>
          <div className="transactions-table-container">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Stock</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDate(transaction.timestamp)}</td>
                    <td>{transaction.is_buy ? 'Buy' : 'Sell'}</td>
                    <td>{transaction.stock_symbol}</td>
                    <td>{transaction.quantity}</td>
                    <td>${transaction.price.toFixed(2)}</td>
                    <td>${(transaction.quantity * transaction.price).toFixed(2)}</td>
                    <td className={getStatusClass(transaction.status)}>
                      {transaction.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="pagination">
            <button
              className="btn btn-secondary"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="page-info">Page {currentPage}</span>
            <button
              className="btn btn-secondary"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={transactions.length < pageSize}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionsPage; 