import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/PaymentReview.css";

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { transactionId, paymentDetails } = location.state || {};

  if (!transactionId || !paymentDetails) {
    navigate("/payment");
    return null;
  }

  const handleNewPayment = () => {
    navigate("/payment");
  };

  const handleGoHome = () => {
    navigate("/home");
  };

  return (
    <div className="payment-review-page">
      <div className="payment-review-card success-card">
        <div className="success-icon">✓</div>
        <h2 className="success-title">Payment Successful!</h2>
        
        <div className="success-details">
          <div className="detail-row">
            <span className="detail-label">Transaction ID:</span>
            <span className="detail-value">{transactionId}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Amount:</span>
            <span className="detail-value">
              {paymentDetails.currency} {parseFloat(paymentDetails.amount).toFixed(2)}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Recipient:</span>
            <span className="detail-value">{paymentDetails.recipientName}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Account:</span>
            <span className="detail-value">{paymentDetails.recipientAccount}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Date:</span>
            <span className="detail-value">{new Date().toLocaleString()}</span>
          </div>
        </div>

        <div className="success-actions">
          <button 
            type="button" 
            className="new-payment-button"
            onClick={handleNewPayment}
          >
            Make Another Payment
          </button>
          <button 
            type="button" 
            className="home-button"
            onClick={handleGoHome}
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;