import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/api";
import "../styles/PaymentReview.css"; // Make sure you have this CSS file

const Review = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false); // Start as false since we have local data
  const [error, setError] = useState("");

  // Get the recent payment data from navigation state or localStorage
  const recentPayment = location.state?.paymentData || 
                       JSON.parse(localStorage.getItem("lastPayment")) || 
                       null;

  // Get token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("accessToken");
  };

  useEffect(() => {
    // Only try to fetch payments if we have a token
    const token = getAuthToken();
    if (token) {
      fetchPayments();
    } else {
      setLoading(false);
      setError("Please log in to view your full payment history");
    }
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Please log in to view payment history");
        return;
      }

      // Try to fetch payments from your API
      const res = await api.get("/payments", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setPayments(res.data.payments || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
      // Don't show error if endpoint doesn't exist (404) or no payments (empty array)
      if (err.response?.status !== 404 && err.response?.status !== 401) {
        setError("Note: Could not load full payment history from server");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMakeNewPayment = () => {
    navigate("/payment");
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Recent";
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString || "Recent";
    }
  };

  // Combine all payments to display
  const allPayments = recentPayment ? [recentPayment, ...payments] : payments;

  return (
    <div className="review-container">
      <Navbar />
      
      <div className="review-content">
        <div className="review-header">
          <h1 className="review-title">Payment Review</h1>
          <p className="review-subtitle">View and manage your payment history</p>
        </div>

        {recentPayment && (
          <div className="recent-payment-banner">
            <div className="success-icon">✓</div>
            <div className="banner-content">
              <h3>Payment Successful!</h3>
              <p>Your payment of {recentPayment.amount} {recentPayment.currency} to {recentPayment.recipientName} was completed successfully.</p>
              {recentPayment.transactionId && (
                <p><strong>Transaction ID:</strong> {recentPayment.transactionId}</p>
              )}
            </div>
          </div>
        )}

        {error && !error.includes("Note:") && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchPayments} className="retry-button">
              Try Again
            </button>
          </div>
        )}

        {error && error.includes("Note:") && (
          <div className="info-message">
            <p>{error}</p>
          </div>
        )}

        <div className="payments-section">
          <h2 className="section-title">
            {recentPayment ? "Recent Payment" : "Your Payments"}
          </h2>
          
          {loading ? (
            <div className="loading-spinner">Loading payment history...</div>
          ) : allPayments.length === 0 ? (
            <div className="no-payments">
              <p>No payments found.</p>
              <button 
                className="cta-button primary"
                onClick={handleMakeNewPayment}
              >
                Make Your First Payment
              </button>
            </div>
          ) : (
            <div className="payments-list">
              {allPayments.map((payment, index) => (
                <div 
                  key={payment.transactionId || payment.id || `payment-${index}`}
                  className={`payment-card ${index === 0 && recentPayment ? 'recent' : ''}`}
                >
                  <div className="payment-card-header">
                    <h3>Payment to {payment.recipientName}</h3>
                    <span className={`status ${index === 0 && recentPayment ? 'just-completed' : 'completed'}`}>
                      {index === 0 && recentPayment ? 'Just Completed' : 'Completed'}
                    </span>
                  </div>
                  
                  <div className="payment-card-details">
                    <div className="detail-row">
                      <span>Amount:</span>
                      <span>{payment.amount} {payment.currency}</span>
                    </div>
                    <div className="detail-row">
                      <span>Recipient Name:</span>
                      <span>{payment.recipientName}</span>
                    </div>
                    <div className="detail-row">
                      <span>Recipient Account:</span>
                      <span>{payment.recipientAccount}</span>
                    </div>
                    <div className="detail-row">
                      <span>SWIFT Code:</span>
                      <span>{payment.swiftCode}</span>
                    </div>
                    <div className="detail-row">
                      <span>Provider:</span>
                      <span>{payment.provider}</span>
                    </div>
                    <div className="detail-row">
                      <span>Date:</span>
                      <span>{formatDate(payment.timestamp || payment.createdAt)}</span>
                    </div>
                    {payment.transactionId && (
                      <div className="detail-row">
                        <span>Transaction ID:</span>
                        <span className="transaction-id">{payment.transactionId}</span>
                      </div>
                    )}
                    {payment.description && (
                      <div className="detail-row">
                        <span>Description:</span>
                        <span>{payment.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="action-buttons">
          <button 
            className="cta-button primary"
            onClick={handleMakeNewPayment}
          >
            Make New Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default Review;