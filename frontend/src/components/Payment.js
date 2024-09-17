import React, { useState, useRef } from "react";
import Navbar from "./Navbar";
import '../App.css'
import { useLocation, useNavigate } from "react-router-dom";
import { Toast } from "bootstrap";

const serverURL = "http://192.168.1.12:6953";

const Payment = ({ setIsLoggedIn, isDarkTheme, toggleTheme }) => {
  const handleGoHome = () => {
    navigate("/");
  };
  const navigate = useNavigate();
  const location = useLocation();
  const qrData = location.state?.qrData || {};

  const shopName = qrData.shopName || "";
  const shopID = qrData.shopID || "";

  const [paymentAmount, setPaymentAmount] = useState("");
  const toastRef = useRef(null);

  const showToast = (message, type = "danger") => {
    const toastElement = toastRef.current;
    const toast = new Toast(toastElement);
    toastElement.querySelector(".toast-body").textContent = message;
    toastElement.classList.remove("bg-success", "bg-danger");
    toastElement.classList.add(`bg-${type}`);
    toast.show();
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (
      !paymentAmount ||
      isNaN(paymentAmount) ||
      parseFloat(paymentAmount) <= 0
    ) {
      showToast("Please enter a valid amount");
      return;
    }

    try {
      const response = await fetch(`${serverURL}/user/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: shopID,
          amount: parseFloat(paymentAmount),
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorCode = response.status;
        let errorMessage = "";

        switch (errorCode) {
          case 404:
            errorMessage = "User not found";
            break;
          case 400:
            errorMessage = "Insufficient balance";
            break;
          case 414:
            errorMessage = "Vendor not found";
            break;
          case 500:
            errorMessage = "Internal server error";
            break;
          case 401:
            errorMessage =
              "Not authenticated. Please log out and log in again.";
            setIsLoggedIn(false);
            navigate("/login");
            break;
          default:
            errorMessage = `Payment failed: ${response.status}`;
        }

        showToast(errorMessage);
        return;
      }

      showToast(
        `Payment of ₹${paymentAmount} to ${shopName} successful!`,
        "success"
      );
      navigate("/payment-confirmation", {
        state: {
          payeeName: shopName,
          amount: paymentAmount,
        },
      });
    } catch (error) {
      showToast(`Payment failed: ${error.message}`);
    }
  };

  return (
    <div>
      <Navbar isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
      <form onSubmit={handlePayment}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "75%",
            margin: "25% auto 0",
          }}
        >
          <h4 style={{ textAlign: "center", marginBottom: "2rem" }}>
            <strong>
              Paying: <br /> {shopName}
            </strong>
          </h4>
          <div className="input-group mb-3" style={{ maxWidth: "300px" }}>
            <span className="input-group-text" style={{ fontSize: "24px" }}>
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              style={{ fontSize: "24px", textAlign: "center" }}
              className="form-control"
              placeholder="Enter amount"
              aria-label="Amount (to the nearest rupee)"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-lg btn-outline-info rounded-pill"
            style={{ marginTop: "2rem" }}
          >
            Pay now
          </button>
          <button onClick={handleGoHome} className="btn btn-primary btn-lg rounded-pill" style={{marginTop:'70%'}}>
            Go to Home
          </button>
        </div>
      </form>
      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 11 }}>
        <div
          ref={toastRef}
          className="toast"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="d-flex">
            <div className="toast-body"></div>
            <button
              type="button"
              className="btn-close me-2 m-auto rounded-pill"
              data-bs-dismiss="toast"
              aria-label="Close"
            ></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;