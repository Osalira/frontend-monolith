import React, { useState, useEffect } from 'react';
import { walletApi } from '../api/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

interface WalletTransaction {
  id: number;
  user_id: number;
  stock_symbol: string | null;
  is_debit: boolean;
  amount: number;
  description: string;
  timestamp: string;
}

interface WalletData {
  balance: number;
  transactions: WalletTransaction[];
}

const WalletPage: React.FC = () => {
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    transactions: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  
  // Fetch wallet balance and transactions
  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      
      // Get wallet balance
      const balanceResponse = await walletApi.getWalletBalance();
      
      // Get recent transactions
      const transactionsResponse = await walletApi.getWalletTransactions({
        limit: 10,
        offset: 0
      });
      
      setWalletData({
        balance: balanceResponse.data.balance,
        transactions: transactionsResponse.data.transactions
      });
    } catch (err: any) {
      toast.error('Failed to load wallet data');
      console.error('Error fetching wallet data:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add money to wallet
  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const amountValue = parseFloat(amount);
    
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    try {
      setIsAddingMoney(true);
      await walletApi.addMoneyToWallet(amountValue);
      
      // Reset form and refresh wallet data
      setAmount('');
      fetchWalletData();
      
      toast.success(`$${amountValue.toFixed(2)} added to your wallet`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add money');
      toast.error('Failed to add money to wallet');
    } finally {
      setIsAddingMoney(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  useEffect(() => {
    fetchWalletData();
  }, []);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="wallet-page">
      <h1>Wallet</h1>
      
      <div className="wallet-balance">
        <h2>Current Balance</h2>
        <div className="balance-amount">${walletData.balance.toFixed(2)}</div>
      </div>
      
      <div className="add-money-form">
        <h2>Add Money</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleAddMoney}>
          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              id="amount"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isAddingMoney}
          >
            {isAddingMoney ? 'Processing...' : 'Add Money'}
          </button>
        </form>
      </div>
      
      <div className="recent-transactions">
        <h2>Recent Transactions</h2>
        
        {walletData.transactions.length === 0 ? (
          <p>No recent transactions</p>
        ) : (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Stock</th>
                <th>Amount</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {walletData.transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{formatDate(transaction.timestamp)}</td>
                  <td>{transaction.is_debit ? 'Debit' : 'Credit'}</td>
                  <td>{transaction.stock_symbol || '-'}</td>
                  <td className={transaction.is_debit ? 'debit' : 'credit'}>
                    {transaction.is_debit ? '-' : '+'}${transaction.amount.toFixed(2)}
                  </td>
                  <td>{transaction.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default WalletPage; 