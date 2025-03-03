import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStock } from '../context/StockContext';
import { adminApi } from '../api/apiService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { stocks, fetchStocks } = useStock();
  const [activeTab, setActiveTab] = useState('create');
  const [isLoading, setIsLoading] = useState(false);

  // Create Stock form state - simplified to just stock_name
  const [createStockForm, setCreateStockForm] = useState({
    stock_name: ''
  });

  // Add Stock to Inventory form state - updated to allow stock_id to be number
  const [addStockForm, setAddStockForm] = useState({
    stock_id: '' as string | number,
    quantity: 0
  });

  useEffect(() => {
    console.log('Fetching stocks...');
    fetchStocks();
  }, [fetchStocks]);

  // Debug effect to log when stocks are updated
  useEffect(() => {
    console.log('Stocks updated:', stocks);
    if (addStockForm.stock_id && typeof addStockForm.stock_id === 'number') {
      // Check if the selected stock still exists in the updated stocks list
      const stockExists = stocks.some(stock => stock.stock_id === addStockForm.stock_id);
      if (!stockExists) {
        console.log(`Selected stock ID ${addStockForm.stock_id} no longer exists, resetting selection`);
        setAddStockForm(prev => ({ ...prev, stock_id: '' }));
      }
    }
  }, [stocks]);

  // Debug effect to log form state changes
  useEffect(() => {
    console.log('Form state updated:', addStockForm);
  }, [addStockForm]);

  // Check if user is a company
  const isCompany = user?.account_type === 'company';

  // Handle create stock form change
  const handleCreateStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCreateStockForm({ stock_name: e.target.value });
  };

  // Handle add stock form change
  const handleAddStockChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    console.log(`Form change - ${name}: ${value} - (type: ${typeof value})`);
    
    if (name === 'stock_id') {
      if (value === '') {
        console.log('Setting empty stock_id');
        setAddStockForm(prev => ({ ...prev, stock_id: '' }));
      } else {
        // Try to find the stock by ID first
        const numericId = parseInt(value);
        console.log(`Parsed stock_id: ${numericId} (${isNaN(numericId) ? 'NaN' : 'valid number'})`);
        
        if (!isNaN(numericId)) {
          // Check if this numeric ID exists in our stocks list
          const stockById = stocks.find(stock => stock.stock_id === numericId);
          
          if (stockById) {
            console.log(`Found stock by ID: ${numericId} - ${stockById.symbol}`);
            setAddStockForm(prev => ({ ...prev, stock_id: numericId }));
          } else {
            console.warn(`No stock found with ID ${numericId}`);
          }
        } else {
          // If not a valid number, maybe it's a symbol?
          console.log(`Trying to find stock by symbol: ${value}`);
          const stockBySymbol = stocks.find(stock => stock.symbol === value);
          
          if (stockBySymbol) {
            console.log(`Found stock by symbol: ${value} - ID: ${stockBySymbol.stock_id}`);
            setAddStockForm(prev => ({ ...prev, stock_id: stockBySymbol.stock_id }));
          } else {
            console.warn(`No stock found with symbol ${value}`);
          }
        }
      }
    } else if (name === 'quantity') {
      const quantity = parseInt(value) || 0;
      setAddStockForm(prev => ({ ...prev, quantity }));
    }
  };

  // Handle create stock form submission
  const handleCreateStock = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!createStockForm.stock_name) {
      toast.error('Please enter a stock name');
      return;
    }

    try {
      setIsLoading(true);
      // Using the exact request format required: {"stock_name":"Google"}
      const response = await adminApi.createStock(createStockForm);
      
      if (response.data && response.data.success) {
        toast.success(`Stock "${createStockForm.stock_name}" created successfully`);
        setCreateStockForm({ stock_name: '' });
        // Refresh stocks list
        fetchStocks();
      } else {
        toast.error(response.data?.error || 'Failed to create stock');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'An error occurred while creating the stock');
      console.error('Create stock error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle add stock form submission
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!addStockForm.stock_id) {
      toast.error('Please select a stock');
      return;
    }

    if (addStockForm.quantity <= 0) {
      toast.error('Please enter a valid quantity greater than 0');
      return;
    }

    try {
      setIsLoading(true);
      // Making sure stock_id is a number
      const response = await adminApi.addStockToUser({
        stock_id: addStockForm.stock_id as number,
        quantity: addStockForm.quantity
      });
      
      if (response.data && response.data.success) {
        toast.success(`${addStockForm.quantity} shares added to your inventory successfully`);
        setAddStockForm({
          stock_id: '' as string | number,
          quantity: 0
        });
      } else {
        toast.error(response.data?.error || 'Failed to add stocks to inventory');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'An error occurred while adding stocks to inventory');
      console.error('Add stock error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCompany) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Admin Access Restricted</h1>
        <p className="text-gray-600 dark:text-gray-300">
          This page is only accessible to company accounts. Please contact an administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Company Admin Panel</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your stocks and inventory</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          <li key="create-tab" className="mr-2">
            <button
              onClick={() => setActiveTab('create')}
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'create'
                  ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
            >
              Create New Stock
            </button>
          </li>
          <li key="inventory-tab" className="mr-2">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'inventory'
                  ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
            >
              Add To Portfolio
            </button>
          </li>
        </ul>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Create Stock Form - Simplified */}
          {activeTab === 'create' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Create New Stock</h2>
              <form onSubmit={handleCreateStock} className="space-y-6">
                <div>
                  <label htmlFor="stock_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock Name *
                  </label>
                  <input
                    type="text"
                    id="stock_name"
                    name="stock_name"
                    value={createStockForm.stock_name}
                    onChange={handleCreateStockChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g. Google"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Enter the name of the stock (e.g. "Google", "Apple", etc.). The system will automatically create a stock symbol and other details.
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full md:w-auto px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm disabled:opacity-50"
                  >
                    Create Stock
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add Stock to Inventory Form - Simplified */}
          {activeTab === 'inventory' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Add Stocks to Your Portfolio</h2>
              {stocks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No stocks available. Create some stocks first.</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Go to Create Stocks
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddStock} className="space-y-6">
                  <div>
                    <label htmlFor="stock_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Select Stock *
                    </label>
                    <select
                      id="stock_id"
                      name="stock_id"
                      value={addStockForm.stock_id === '' ? '' : String(addStockForm.stock_id)}
                      onChange={handleAddStockChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    >
                      <option key="default-option" value="">Select a stock</option>
                      {stocks.map((stock, index) => {
                        // Ensure we have a valid stock_id and a unique key
                        const stockId = stock.stock_id;
                        const uniqueKey = `stock-${stockId || index}`;
                        
                        // Skip any stock without a valid ID
                        if (!stockId) {
                          console.warn('Stock without ID:', stock);
                          return null;
                        }
                        
                        return (
                          <option 
                            key={uniqueKey} 
                            value={String(stockId)}
                          >
                            {stock.symbol} - {stock.stock_name}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={addStockForm.quantity || ''}
                      onChange={handleAddStockChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter quantity"
                      min="1"
                      step="1"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Enter the number of shares to add to your Portfolio
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full md:w-auto px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm disabled:opacity-50"
                    >
                      Add to Inventory
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPage; 