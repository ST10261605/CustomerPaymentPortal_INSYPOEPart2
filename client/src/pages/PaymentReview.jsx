import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/PaymentReview.css";

function PaymentReview() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get payment data from navigation state
  const paymentData = location.state?.paymentData;

  // If no payment data, redirect back to payment page
  if (!paymentData) {
    navigate("/payment");
    return null;
  }

  const handleConfirmPayment = async () => {
    try {
      // Get authentication token
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("Please log in to make a payment");
        navigate("/login");
        return;
      }

      // Submit the payment
      const response = await fetch("http://localhost:5000/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        const result = await response.json();
        // Navigate to success page or show success message
        navigate("/payment-success", { 
          state: { 
            transactionId: result.transactionId || result.payment?.id,
            paymentDetails: paymentData
          }
        });
      } else {
        const error = await response.json();
        alert(`Payment failed: ${error.msg || error.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Payment confirmation error:", error);
      alert("Payment failed. Please try again.");
    }
  };

  const handleEditPayment = () => {
    // Navigate back to payment page with the existing data
    navigate("/payment", { state: { formData: paymentData } });
  };

  return (
    <div className="payment-review-page">
      <div className="payment-review-card">
        <h2 className="review-title">Review Your Payment</h2>
        <p className="review-subtitle">Please confirm your payment details before proceeding</p>

        <div className="payment-details">
          <div className="detail-row">
            <span className="detail-label">Amount:</span>
            <span className="detail-value">
              {paymentData.currency} {parseFloat(paymentData.amount).toFixed(2)}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Payment Provider:</span>
            <span className="detail-value">{paymentData.provider}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Recipient Name:</span>
            <span className="detail-value">{paymentData.recipientName}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Recipient Account:</span>
            <span className="detail-value">{paymentData.recipientAccount}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">SWIFT/BIC Code:</span>
            <span className="detail-value">{paymentData.swiftCode}</span>
          </div>

          {paymentData.description && (
            <div className="detail-row">
              <span className="detail-label">Description:</span>
              <span className="detail-value">{paymentData.description}</span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Date:</span>
            <span className="detail-value">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="review-actions">
          <button 
            type="button" 
            className="edit-button"
            onClick={handleEditPayment}
          >
            Edit Payment
          </button>
          <button 
            type="button" 
            className="confirm-button"
            onClick={handleConfirmPayment}
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentReview;