import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PortfolioPage from './pages/PortfolioPage';
import TradePage from './pages/TradePage';
import WalletPage from './pages/WalletPage';
import TransactionsPage from './pages/TransactionsPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Context
import { AuthProvider } from './context/AuthContext';
import { StockProvider } from './context/StockContext';
import { ThemeProvider } from './context/ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StockProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
              <Navbar />
              <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <main className="flex-grow py-8">
                  <div className="mx-auto max-w-4xl">
                    <Routes>
                      {/* Redirect from root to login page */}
                      <Route path="/" element={<Navigate to="/login" replace />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      
                      {/* Protected Routes */}
                      <Route 
                        path="/dashboard" 
                        element={
                          <ProtectedRoute>
                            <DashboardPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/portfolio" 
                        element={
                          <ProtectedRoute>
                            <PortfolioPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/trade" 
                        element={
                          <ProtectedRoute>
                            <TradePage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/wallet" 
                        element={
                          <ProtectedRoute>
                            <WalletPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/transactions" 
                        element={
                          <ProtectedRoute>
                            <TransactionsPage />
                          </ProtectedRoute>
                        } 
                      />
                      
                      <Route 
                        path="/admin" 
                        element={
                          <ProtectedRoute>
                            <AdminPage />
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* 404 Page */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </div>
                </main>
              </div>
              <Footer />
              <ToastContainer position="bottom-right" />
            </div>
          </Router>
        </StockProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
