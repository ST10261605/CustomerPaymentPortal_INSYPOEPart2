import React, { useState } from "react";
import { motion } from "framer-motion";
import api from "../api/api";
import "../styles/RegisterEmployee.css";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

function RegisterEmployee() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    accountNumber: "",
    password: "",
  });
  
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    const idRegex = /^\d{6,20}$/;
    const accountRegex = /^\d{8,12}$/;

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    } else if (!nameRegex.test(formData.fullName)) {
      newErrors.fullName = "Please enter a valid name (letters and spaces only).";
    }

    // ID Number validation
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = "ID number is required.";
    } else if (!idRegex.test(formData.idNumber)) {
      newErrors.idNumber = "ID number must be 6-20 digits.";
    }

    // Account Number validation
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = "Account number is required.";
    } else if (!accountRegex.test(formData.accountNumber)) {
      newErrors.accountNumber = "Account number must be 8-12 digits.";
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
  
    if (!validateForm()) {
      setMessage("Please fix the errors before submitting.");
      return;
    }
  
    setIsLoading(true);
  
    try {
      const token = localStorage.getItem("accessToken");
      console.log("Token being sent:", token ? "Token exists" : "No token");
      
      if (!token) {
        throw new Error("Please log in as admin to register employees");
      }
  
      const employeeData = {
        fullName: formData.fullName.trim(),
        idNumber: formData.idNumber,
        accountNumber: formData.accountNumber,
        password: formData.password
      };
  
      console.log("Sending employee data:", employeeData);
  
      // using api instance instead of raw fetch
      const response = await api.post("/auth/register-employee", employeeData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      console.log("Server response:", response.data);
  
      if (response.status === 201) {
        setMessage("Employee registered successfully!");
        setFormData({ fullName: "", idNumber: "", accountNumber: "", password: "" });
        
        // Optional: Redirect after successful registration
        setTimeout(() => {
          navigate("/admin/home");
        }, 2000);
      }
    } catch (err) {
      console.error("Registration error:", err);
      
      // More detailed error handling
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        setMessage("Cannot connect to server. Please make sure the backend is running on port 5000.");
      } else if (err.response) {
        // Server responded with error status
        setMessage(err.response.data?.error || err.response.data?.message || "Error registering employee.");
      } else if (err.request) {
        // Request was made but no response received
        setMessage("No response from server. Please check if the backend is running.");
      } else {
        setMessage(err.message || "Server error while registering employee.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-employee-page-container">
      {/* Navbar at the top */}
      <Navbar />
      
      {/* Main registration content */}
      <div className="register-employee-page">
        {/* Animated background glow */}
        <div className="glow-behind"></div>

        <motion.div
          className="register-employee-card"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <h2 className="register-employee-title">Register Employee</h2>
          <p className="register-employee-subtitle">Add a new employee to the system</p>

          {message && (
            <motion.div 
              className={`register-employee-message ${message.includes("successfully") ? "success" : "error"}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p>{message}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="fullName">Full Name *</label>
              <motion.input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className={errors.fullName ? "error" : ""}
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              {errors.fullName && <motion.span 
                className="error-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >{errors.fullName}</motion.span>}
            </div>

            <div className="input-group">
              <label htmlFor="idNumber">ID Number *</label>
              <motion.input
                id="idNumber"
                name="idNumber"
                type="text"
                value={formData.idNumber}
                onChange={handleChange}
                placeholder="1234567890123"
                required
                className={errors.idNumber ? "error" : ""}
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              {errors.idNumber && <motion.span 
                className="error-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >{errors.idNumber}</motion.span>}
            </div>

            <div className="input-group">
              <label htmlFor="accountNumber">Account Number *</label>
              <motion.input
                id="accountNumber"
                name="accountNumber"
                type="text"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="12345678"
                required
                className={errors.accountNumber ? "error" : ""}
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              {errors.accountNumber && <motion.span 
                className="error-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >{errors.accountNumber}</motion.span>}
            </div>

            <div className="input-group">
              <label htmlFor="password">Password *</label>
              <motion.input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className={errors.password ? "error" : ""}
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              {errors.password && <motion.span 
                className="error-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >{errors.password}</motion.span>}
            </div>

            <motion.button 
              className={`register-employee-button ${isLoading ? "loading" : ""}`} 
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? "Registering..." : "Register Employee"}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default RegisterEmployee;