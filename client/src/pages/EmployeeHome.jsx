import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../api/api";
import "../styles/EmployeeHome.css";
import Navbar from "../components/Navbar";

function EmployeeHome() {
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [verifiedTransactions, setVerifiedTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchPendingTransactions();
  }, []);

const fetchPendingTransactions = async () => {
  try {
    const token = localStorage.getItem("accessToken");
    const response = await api.get("/transactions/pending", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Pending transactions:", response.data);
    setPendingTransactions(response.data.transactions || []);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    console.error("Error details:", error.response?.data);
    setMessage("Error loading transactions: " + (error.response?.data?.error || error.message));
  }
};

const verifyTransaction = async (transactionId) => {
  try {
    const token = localStorage.getItem("accessToken");
    console.log("Verifying transaction:", transactionId);
    console.log("Using token:", token ? "Token exists" : "No token");

    const response = await api.patch(
      `/transactions/${transactionId}/verify`,
      {},
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );

    console.log("Verify response:", response.data);

    if (response.status === 200) {
      // Move transaction from pending to verified
      const transaction = pendingTransactions.find(t => t._id === transactionId);
      setPendingTransactions(prev => prev.filter(t => t._id !== transactionId));
      setVerifiedTransactions(prev => [...prev, { ...transaction, status: "verified" }]);
      setMessage("Transaction verified successfully!");
    }
  } catch (error) {
    console.error("Error verifying transaction:", error);
    console.error("Error response:", error.response?.data);
    
    let errorMessage = "Error verifying transaction";
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setMessage(errorMessage);
  }
};

  const unverifyTransaction = async (transactionId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await api.patch(
        `/transactions/${transactionId}/unverify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        // Move transaction back to pending
        const transaction = verifiedTransactions.find(t => t._id === transactionId);
        setVerifiedTransactions(prev => prev.filter(t => t._id !== transactionId));
        setPendingTransactions(prev => [...prev, { ...transaction, status: "pending" }]);
        setMessage("Transaction unverified!");
      }
    } catch (error) {
      console.error("Error unverifying transaction:", error);
      setMessage("Error unverifying transaction");
    }
  };

  const submitToSwift = async () => {
    if (verifiedTransactions.length === 0) {
      setMessage("No verified transactions to submit");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const transactionIds = verifiedTransactions.map(t => t._id);
      
      const response = await api.post("/transactions/submit-to-swift", 
        { transactionIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setMessage(`Successfully submitted ${verifiedTransactions.length} transactions to SWIFT!`);
        setVerifiedTransactions([]);
        fetchPendingTransactions(); // Refresh pending transactions
      }
    } catch (error) {
      console.error("Error submitting to SWIFT:", error);
      setMessage("Error submitting transactions to SWIFT");
    } finally {
      setIsLoading(false);
    }
  };

  const validateSwiftCode = (swiftCode) => {
    const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    return swiftRegex.test(swiftCode);
  };

  const validateAccountNumber = (accountNumber) => {
    const accountRegex = /^\d{6,20}$/;
    return accountRegex.test(accountNumber);
  };

  return (
    <div className="employee-home-container">
      <Navbar />
      
      <div className="employee-home-page">
        <div className="glow-behind"></div>

        <motion.div
          className="employee-home-card"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <h2 className="employee-home-title">Transaction Verification</h2>
          <p className="employee-home-subtitle">Verify and process customer payments</p>

          {message && (
            <motion.div 
              className={`employee-message ${message.includes("Successfully") || message.includes("successfully") ? "success" : "error"}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p>{message}</p>
            </motion.div>
          )}

          {/* Transaction Tabs */}
          <div className="transaction-tabs">
            <button 
              className={`tab-button ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              Pending ({pendingTransactions.length})
            </button>
            <button 
              className={`tab-button ${activeTab === "verified" ? "active" : ""}`}
              onClick={() => setActiveTab("verified")}
            >
              Verified ({verifiedTransactions.length})
            </button>
          </div>

          {/* Pending Transactions */}
          {activeTab === "pending" && (
            <div className="transactions-section">
              <h3>Pending Verification</h3>
              {pendingTransactions.length === 0 ? (
                <p className="no-transactions">No pending transactions</p>
              ) : (
                <div className="transactions-list">
                  {pendingTransactions.map((transaction) => (
                    <motion.div
                      key={transaction._id}
                      className="transaction-card"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="transaction-info">
                        <div className="transaction-main">
                          <h4>{transaction.recipientName}</h4>
                          <p className="amount">
                            {transaction.amount} {transaction.currency}
                          </p>
                        </div>
                        <div className="transaction-details">
                          <p><strong>Account:</strong> {transaction.recipientAccount}</p>
                          <p><strong>SWIFT:</strong> 
                            <span className={validateSwiftCode(transaction.swiftCode) ? "valid" : "invalid"}>
                              {transaction.swiftCode}
                            </span>
                          </p>
                          <p><strong>Date:</strong> {new Date(transaction.createdAt).toLocaleDateString()}</p>
                          {transaction.description && (
                            <p><strong>Description:</strong> {transaction.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="transaction-actions">
                        <motion.button
                          className="verify-button"
                          onClick={() => verifyTransaction(transaction._id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Verify
                        </motion.button>
                        <button 
                          className="details-button"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          Details
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Verified Transactions */}
          {activeTab === "verified" && (
            <div className="transactions-section">
              <div className="verified-header">
                <h3>Ready for SWIFT</h3>
                {verifiedTransactions.length > 0 && (
                  <motion.button
                    className="swift-submit-button"
                    onClick={submitToSwift}
                    disabled={isLoading}
                    whileHover={{ scale: isLoading ? 1 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isLoading ? "Submitting..." : `Submit to SWIFT (${verifiedTransactions.length})`}
                  </motion.button>
                )}
              </div>
              
              {verifiedTransactions.length === 0 ? (
                <p className="no-transactions">No verified transactions</p>
              ) : (
                <div className="transactions-list">
                  {verifiedTransactions.map((transaction) => (
                    <motion.div
                      key={transaction._id}
                      className="transaction-card verified"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="transaction-info">
                        <div className="transaction-main">
                          <h4>{transaction.recipientName} ✓</h4>
                          <p className="amount">
                            {transaction.amount} {transaction.currency}
                          </p>
                        </div>
                        <div className="transaction-details">
                          <p><strong>Account:</strong> 
                            <span className={validateAccountNumber(transaction.recipientAccount) ? "valid" : "invalid"}>
                              {transaction.recipientAccount}
                            </span>
                          </p>
                          <p><strong>SWIFT:</strong> 
                            <span className={validateSwiftCode(transaction.swiftCode) ? "valid" : "invalid"}>
                              {transaction.swiftCode}
                            </span>
                          </p>
                          <p><strong>Verified:</strong> Ready for SWIFT</p>
                        </div>
                      </div>
                      <div className="transaction-actions">
                        <motion.button
                          className="unverify-button"
                          onClick={() => unverifyTransaction(transaction._id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Undo
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Transaction Details Modal */}
          {selectedTransaction && (
            <div className="modal-overlay" onClick={() => setSelectedTransaction(null)}>
              <motion.div 
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <h3>Transaction Details</h3>
                <div className="transaction-details-grid">
                  <div className="detail-item">
                    <label>Recipient Name:</label>
                    <span>{selectedTransaction.recipientName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Amount:</label>
                    <span>{selectedTransaction.amount} {selectedTransaction.currency}</span>
                  </div>
                  <div className="detail-item">
                    <label>Account Number:</label>
                    <span className={validateAccountNumber(selectedTransaction.recipientAccount) ? "valid" : "invalid"}>
                      {selectedTransaction.recipientAccount}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>SWIFT Code:</label>
                    <span className={validateSwiftCode(selectedTransaction.swiftCode) ? "valid" : "invalid"}>
                      {selectedTransaction.swiftCode}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Provider:</label>
                    <span>{selectedTransaction.provider}</span>
                  </div>
                  <div className="detail-item">
                    <label>Date:</label>
                    <span>{new Date(selectedTransaction.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedTransaction.description && (
                    <div className="detail-item full-width">
                      <label>Description:</label>
                      <span>{selectedTransaction.description}</span>
                    </div>
                  )}
                </div>
                <div className="modal-actions">
                  <button 
                    className="close-button"
                    onClick={() => setSelectedTransaction(null)}
                  >
                    Close
                  </button>
                  {selectedTransaction.status === "pending" && (
                    <button 
                      className="verify-button"
                      onClick={() => {
                        verifyTransaction(selectedTransaction._id);
                        setSelectedTransaction(null);
                      }}
                    >
                      Verify Transaction
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default EmployeeHome;