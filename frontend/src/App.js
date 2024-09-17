import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Scanner from './components/Scanner';
import Payment from './components/Payment';
import PaymentConfirmation from './components/PaymentConfirmation';
import ShopkeeperDashboard from './components/ShopkeeperDashboard';
import './App.css';

const serverURL = "http://192.168.1.12:6953";

// Separate component for authenticated routes
const AuthenticatedRoutes = ({ user, setUser, isDarkTheme, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('AuthenticatedRoutes - Current user:', user);
    
    if (user) {
      if (user.role === 'shopOwner' && location.pathname === '/home') {
        console.log('Redirecting shopOwner to /shopkeeperDashboard');
        navigate('/shopkeeperDashboard');
      } else if (user.role === 'fresher' && location.pathname === '/shopkeeperDashboard') {
        console.log('Redirecting fresher to /home');
        navigate('/home');
      }
    }
  }, [user, location, navigate]);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${serverURL}/auth/logout`, {
        method: "POST",
        credentials: 'include',
      });

      if (response.ok) {
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Protected route component
  const ProtectedRoute = ({ children, allowedRoles }) => {
    console.log('ProtectedRoute - user role:', user?.role, 'allowed roles:', allowedRoles);
    if (!user) {
      console.log('No user, redirecting to login');
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles.includes(user.role) || user.role === 'admin') {
      console.log('User role allowed, rendering children');
      return children;
    }

    console.log('User role not allowed, redirecting to home');
    return <Navigate to="/" replace />;
  };

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user.role === 'fresher' ? (
            <Navigate to="/home" replace />
          ) : user.role === 'shopOwner' ? (
            <Navigate to="/shopkeeperDashboard" replace />
          ) : (
            <Navigate to="/home" replace />
          )
        } 
      />

      <Route 
        path="/home" 
        element={
          <ProtectedRoute allowedRoles={['fresher']}>
            <Home isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} setUser={setUser} handleLogout={handleLogout} />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/scanner" 
        element={
          <ProtectedRoute allowedRoles={['fresher']}>
            <Scanner />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/payment" 
        element={
          <ProtectedRoute allowedRoles={['fresher']}>
            <Payment isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} setUser={setUser} handleLogout={handleLogout} />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/payment-confirmation" 
        element={
          <ProtectedRoute allowedRoles={['fresher']}>
            <PaymentConfirmation />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/shopkeeperDashboard" 
        element={
          <ProtectedRoute allowedRoles={['shopOwner']}>
            <ShopkeeperDashboard isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} handleLogout={handleLogout} />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    document.body.setAttribute('data-bs-theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={<Login setUser={setUser} isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />} 
        />
        <Route 
          path="/*" 
          element={
            user ? (
              <AuthenticatedRoutes user={user} setUser={setUser} isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;