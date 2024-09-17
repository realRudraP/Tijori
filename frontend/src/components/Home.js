import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import { Toast, ToastContainer } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../App.css';

function Home({ isDarkTheme, toggleTheme   }) {
  const [nickname, setNickname] = useState('');
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const navigate = useNavigate();
  const serverURL = "http://192.168.1.12:6953";

  useEffect(() => {
    if (isAuthenticated) {
      validateToken();
    }
  }, [isAuthenticated]);

  const validateToken = async () => {
    try {
      const response = await fetch(`${serverURL}/user/data`, {
        method: "GET",
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Token invalid');
      }

      const userData = await response.json();
      setNickname(userData.nickname || userData.shop_name);
      setBalance(userData.balance);
      localStorage.setItem('userNickname', userData.nickname || userData.shop_name);
      localStorage.setItem('userBalance', userData.balance);
    } catch (error) {
      console.error("Token validation failed:", error);
      localStorage.setItem('isLoggedIn', 'false');
      setIsAuthenticated(false); // Update authentication state
      navigate('/login');
    }
  };

  const fetchUserData = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const response = await fetch(`${serverURL}/user/data`, {
        method: "GET",
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const userData = await response.json();
      setBalance(userData.balance);
      localStorage.setItem('userBalance', userData.balance);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError(true);
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${serverURL}/auth/logout`, {
        method: "POST",
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      localStorage.setItem('isLoggedIn', 'false');
      localStorage.removeItem('userNickname');
      localStorage.removeItem('userBalance');
      localStorage.removeItem('user');
      setIsAuthenticated(false); // Update authentication state
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      setShowToast(true);
    }
  };

  function sendToPay() {
    navigate("/scanner");
  }

  return (
    <>
      <Navbar isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
      <div 
        style={{
          position: 'absolute',
          top: '0px',
          left: '0px',
          width: '100vw',
          height: '140vh',
          backgroundImage: `url('khoon2.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'left',
          backgroundRepeat: 'no-repeat',
          zIndex: 1,
        }}
      />
      {/* Person Info */}
      <div
        id="personInfo"
        className="d-flex align-items-center justify-content-between"
        style={{
          position: 'relative',
          marginLeft: '10%',
          marginRight: '10%',
          marginTop: '5%',
          zIndex: 2,
        }}
      >
        <div className="d-flex align-items-center">
          <div style={{ width: '30%', paddingRight: '10px' }}>
            <img
              src="https://static.vecteezy.com/system/resources/thumbnails/017/048/557/small_2x/mafia-character-abstract-silhouette-men-head-in-hat-vintage-illustration-free-vector.jpg"
              className="img-fluid rounded-circle"
              alt="Person silhouette"
            />
          </div>
          <div style={{color:'white'}}>
            <p className="mb-0">
              <strong>ID: </strong><span id="idField">{nickname}</span>
            </p>
          </div>
        </div>
        <button className="btn btn-outline-danger rounded-pill" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Card Section */}
      <div className="container-lg mt-4" style={{ position: 'relative', zIndex: 2 }}>
        <div className="card" style={{ width: '18rem' }} id="mainCard">
          <div className="card-body">
            <h5 className={`card-title ${error ? 'text-muted' : ''}`} id="bigMoney">
              ₹{balance}
            </h5>
            <button 
              className="btn btn-outline-primary btn-sm mt-2 rounded-pill" 
              onClick={fetchUserData}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <i className="bi bi-arrow-clockwise"></i>
              )}
              {' '}Refresh Balance
            </button>
          </div>
          <button type="button" className="btn btn-success rounded-pill" onClick={sendToPay}>
            <i className="bi bi-qr-code-scan"></i> Scan and Pay now
          </button>
        </div>
      </div>

      {/* Toast */}
      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 3 }}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide>
          <Toast.Header>
            <strong className="me-auto">Error</strong>
          </Toast.Header>
          <Toast.Body>An error occurred. Please try again later.</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}

export default Home;
