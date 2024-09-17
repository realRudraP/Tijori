import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PaymentConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { payeeName, amount } = location.state || {};

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-body text-center">
          <h2 className="card-title mb-4">Payment Successful!</h2>
          <i class="bi bi-check-circle" style={{color:'green',fontSize:'90px'}}></i>
          <p className="card-text" style={{textAlign:"center"}}>
            You have successfully paid <br/><span style={{fontSize:"70px"}}><strong>₹{amount}</strong></span><br/> to<br/><span style={{fontSize:"50px"}}> <strong>{payeeName}</strong>.</span>
          </p>
          
          <button onClick={handleGoHome} className="btn btn-primary btn-lg">
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmation;