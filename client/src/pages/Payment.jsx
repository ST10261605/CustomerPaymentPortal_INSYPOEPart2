import { useState } from "react";
import api from "../api/api";
import "../styles/Payment.css";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

function Payment() {
  const navigate = useNavigate(); 
  const [formData, setFormData] = useState({
    amount: "",
    currency: "USD",
    provider: "SWIFT",
    recipientAccount: "",
    swiftCode: "",
    recipientName: "",
    description: ""
  });
  
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("accessToken");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const amountNum = parseFloat(formData.amount);
    const accountRegex = /^\d{6,20}$/;
    const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;

    // Amount validation
    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required.";
    } else if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = "Please enter a valid amount greater than 0.";
    } else if (amountNum > 1000000) {
      newErrors.amount = "Amount cannot exceed 1,000,000.";
    }

    // Recipient account validation
    if (!formData.recipientAccount.trim()) {
      newErrors.recipientAccount = "Recipient account number is required.";
    } else if (!accountRegex.test(formData.recipientAccount)) {
      newErrors.recipientAccount = "Account number must be 6-20 digits.";
    }

    // SWIFT code validation
    if (!formData.swiftCode.trim()) {
      newErrors.swiftCode = "SWIFT code is required.";
    } else if (!swiftRegex.test(formData.swiftCode.toUpperCase())) {
      newErrors.swiftCode = "Please enter a valid SWIFT code (e.g., BANKUS33).";
    }

    // Recipient name validation
    if (!formData.recipientName.trim()) {
      newErrors.recipientName = "Recipient name is required.";
    } else if (!nameRegex.test(formData.recipientName)) {
      newErrors.recipientName = "Please enter a valid name (letters and spaces only).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) {
      setMessage("Please fix the errors before submitting.");
      return;
    }

    setIsLoading(true);

    try {
      const paymentData = {
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        provider: formData.provider,
        recipientAccount: formData.recipientAccount,
        swiftCode: formData.swiftCode.toUpperCase(),
        recipientName: formData.recipientName.trim(),
        description: formData.description.trim() || `Payment to ${formData.recipientName.trim()}`
      };

      console.log("Sending payment data:", paymentData);

      // Get authentication token
      const token = getAuthToken();
      if (!token) {
        throw new Error("Please log in to make a payment");
      }

      const res = await api.post("/payment", paymentData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log("Payment response:", res.data);

      // Prepare data for the payment details page
      const paymentReview = {
        ...paymentData,
        transactionId: res.data.transactionId || res.data.payment?.id || `TXN-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        status: "Completed"
      };

      // Store in localStorage as backup
      localStorage.setItem("lastPayment", JSON.stringify(paymentReview));

      // Redirect to payment details page with data
      navigate("/review", { 
        state: { paymentData: paymentReview } 
      });

    } catch (err) {
      console.error("Payment error:", err);
      
      let errorMessage = "Payment failed. Please try again.";
      
      if (err.response) {
        errorMessage = err.response.data?.msg || 
                      err.response.data?.message || 
                      err.response.data?.error ||
                      `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. Please try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Test button to fill sample data
  const fillSampleData = () => {
    setFormData({
      amount: "100.00",
      currency: "USD",
      provider: "SWIFT",
      recipientAccount: "1234567890",
      swiftCode: "BANKUS33",
      recipientName: "John Smith",
      description: "Invoice payment"
    });
  };

  return (
    <div className="payment-page-container">
      {/* Navbar at the top */}
      <Navbar />
      
      {/* Main payment content */}
      <div className="payment-page">
        <div className="payment-card">
          <h2 className="payment-title">Make a Payment</h2>

          {/* Test button - remove in production */}
          <button 
            type="button" 
            onClick={fillSampleData}
            className="sample-data-btn"
          >
            Fill Sample Data
          </button>

          {message && (
            <div className="payment-message payment-error">
              <p>{message}</p>
            </div>
          )}

          <form onSubmit={handlePayment}>
            <div className="input-group">
              <label htmlFor="amount">Amount *</label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                max="1000000"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                required
                className={errors.amount ? "error" : ""}
              />
              {errors.amount && <span className="error-text">{errors.amount}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="currency">Currency *</label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="ZAR">ZAR - South African Rand</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="provider">Payment Provider *</label>
              <select
                id="provider"
                name="provider"
                value={formData.provider}
                onChange={handleChange}
              >
                <option value="SWIFT">SWIFT Transfer</option>
                <option value="SEPA">SEPA Transfer</option>
                <option value="FEDWIRE">Fedwire</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="recipientName">Recipient Name *</label>
              <input
                id="recipientName"
                name="recipientName"
                type="text"
                value={formData.recipientName}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className={errors.recipientName ? "error" : ""}
              />
              {errors.recipientName && <span className="error-text">{errors.recipientName}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="recipientAccount">Recipient Account Number *</label>
              <input
                id="recipientAccount"
                name="recipientAccount"
                type="text"
                value={formData.recipientAccount}
                onChange={handleChange}
                placeholder="1234567890"
                required
                className={errors.recipientAccount ? "error" : ""}
              />
              {errors.recipientAccount && <span className="error-text">{errors.recipientAccount}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="swiftCode">SWIFT/BIC Code *</label>
              <input
                id="swiftCode"
                name="swiftCode"
                type="text"
                value={formData.swiftCode}
                onChange={handleChange}
                placeholder="BANKUS33"
                required
                className={errors.swiftCode ? "error" : ""}
                style={{ textTransform: 'uppercase' }}
              />
              {errors.swiftCode && <span className="error-text">{errors.swiftCode}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="description">Description (Optional)</label>
              <input
                id="description"
                name="description"
                type="text"
                value={formData.description}
                onChange={handleChange}
                placeholder="Payment description"
              />
            </div>

            <button 
              className={`payment-button ${isLoading ? "loading" : ""}`} 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Pay Now"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Payment;