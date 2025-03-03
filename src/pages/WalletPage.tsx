import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { walletApi } from '../api/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface WalletTransaction {
  id: number | string;
  amount: number | string;
  timestamp: string;
  transaction_type: string;
  status: string;
  description?: string;
}

interface WalletData {
  balance: number | string;
  transactions: WalletTransaction[];
}

const WalletPage: React.FC = () => {
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      
      // Fetch wallet balance
      const balanceResponse = await walletApi.getWalletBalance();
      console.log('Wallet balance response:', balanceResponse);
      
      let balance = 0;
      
      // Handle different response formats
      if (balanceResponse.data && balanceResponse.data.success === true) {
        if (balanceResponse.data.data && typeof balanceResponse.data.data.balance !== 'undefined') {
          const rawBalance = balanceResponse.data.data.balance;
          balance = typeof rawBalance === 'number' ? rawBalance : parseFloat(rawBalance) || 0;
        }
      } else if (balanceResponse.data && typeof balanceResponse.data.balance !== 'undefined') {
        // Direct format
        const rawBalance = balanceResponse.data.balance;
        balance = typeof rawBalance === 'number' ? rawBalance : parseFloat(rawBalance) || 0;
      }
      
      console.log('Parsed balance:', balance);
      
      // Fetch wallet transactions
      const transactionsResponse = await walletApi.getWalletTransactions();
      console.log('Wallet transactions response:', transactionsResponse);
      
      let transactions: WalletTransaction[] = [];
      
      // Handle different response formats
      if (transactionsResponse.data && transactionsResponse.data.success === true) {
        if (Array.isArray(transactionsResponse.data.data)) {
          transactions = transactionsResponse.data.data;
        } else if (transactionsResponse.data.data && Array.isArray(transactionsResponse.data.data.transactions)) {
          transactions = transactionsResponse.data.data.transactions;
        }
      } else if (Array.isArray(transactionsResponse.data)) {
        transactions = transactionsResponse.data;
      } else if (transactionsResponse.data && Array.isArray(transactionsResponse.data.transactions)) {
        transactions = transactionsResponse.data.transactions;
      }
      
      setWalletData({
        balance,
        transactions: transactions || []
      });
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!depositAmount || isNaN(parseFloat(depositAmount)) || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await walletApi.addMoneyToWallet(parseFloat(depositAmount));
      
      if (response.data && response.data.success) {
        toast.success('Funds added successfully');
        setDepositAmount('');
        fetchWalletData(); // Refresh wallet data
      } else {
        throw new Error(response.data?.error || 'Failed to add funds');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add funds');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      return dateString || 'Unknown date';
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'purchase':
        return 'Stock Purchase';
      case 'sale':
        return 'Stock Sale';
      default:
        return type || 'Transaction';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const formatCurrency = (amount: number | string) => {
    if (typeof amount === 'string') {
      amount = parseFloat(amount) || 0;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Your Wallet</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your funds and view transaction history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Balance and Add Funds */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Current Balance</h2>
            </div>
            <div className="p-6">
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                {formatCurrency(walletData.balance)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Available for trading and withdrawals
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Add Funds</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleDepositSubmit}>
                <div className="mb-4">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (USD)
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="amount"
                      id="amount"
                      min="1"
                      step="0.01"
                      className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'Add Funds'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Transactions */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              {walletData.transactions.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <p>No transactions found</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {walletData.transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {formatDate(transaction.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {getTransactionTypeLabel(transaction.transaction_type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(transaction.status)}`}>
                            {transaction.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {transaction.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage; 