import React, { useState, useEffect } from "react";
import "../styles/Register.css";
import api, { getCsrfToken } from "../api/api";
import { useNavigate } from "react-router-dom";
import validator from "validator";
import Navbar from "../components/Navbar";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    idNumber: "",
    accountNumber: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    fullName: "",
    idNumber: "",
    accountNumber: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [particles, setParticles] = useState([]);
  const [csrfReady, setCsrfReady] = useState(false); // Add this state
  const [isLoading, setIsLoading] = useState(false);



  useEffect(() => {
     // Initialize CSRF token when component mounts
    const initializeCsrf = async () => {
      try {
        setIsLoading(true);
        await getCsrfToken();
        setCsrfReady(true);
        console.log('✅ CSRF ready for registration');
      } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
        setMessage("Security setup failed. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };
    initializeCsrf();

    // Generate smooth floating particles
    const particleArray = Array.from({ length: 25 }, () => ({
      size: Math.random() * 8 + 4,
      left: Math.random() * 100,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
      sway: Math.random() * 20 + 5,
    }));
    setParticles(particleArray);
  }, []);

  // Validation 
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "fullName":
        if (!value.trim()) {
          error = "Full name cannot be empty.";
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          error = "Full name may only contain letters and spaces.";
        }
        break;
      case "idNumber":
        if (!value.trim()) {
          error = "ID number cannot be empty.";
        } else if (!/^\d{13}$/.test(value)) {
          error = "ID number must be exactly 13 digits.";
        }
        break;
      case "accountNumber":
        if (!value.trim()) {
          error = "Account number cannot be empty.";
        } else if (!/^\d{8,12}$/.test(value)) {
          error = "Account number must be between 8 and 12 digits.";
        }
        break;
      case "password":
        if (!value.trim()) {
          error = "Password cannot be empty.";
        } else if (
          !validator.isStrongPassword(value, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
          })
        ) {
          error = "Password must include uppercase, lowercase, number, and symbol.";
        }
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (value.trim()) {
      validateField(name, value);
    } else {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  // Validate before submitting
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    
    // Check if CSRF is ready
    if (!csrfReady) {
      setMessage("Security token not ready. Please wait...");
      return;
    }

    const newErrors = {
      fullName: !form.fullName.trim() 
        ? "Full name cannot be empty." 
        : !/^[a-zA-Z\s]+$/.test(form.fullName)
        ? "Full name may only contain letters and spaces."
        : "",
      idNumber: !form.idNumber.trim()
        ? "ID number cannot be empty."
        : !/^\d{13}$/.test(form.idNumber)
        ? "ID number must be exactly 13 digits."
        : "",
      accountNumber: !form.accountNumber.trim()
        ? "Account number cannot be empty."
        : !/^\d{8,12}$/.test(form.accountNumber)
        ? "Account number must be between 8 and 12 digits."
        : "",
      password: !form.password.trim()
        ? "Password cannot be empty."
        : !validator.isStrongPassword(form.password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
          })
        ? "Password must include uppercase, lowercase, number, and symbol."
        : "",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((msg) => msg)) {
      setMessage("Registration failed! Please fix the following errors before registering.");
      return;
    }

    try {
      const response = await api.post("/auth/register", form);
      setMessage("Registration successful! Redirecting to login...");
      
      if (response.data && response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      if (error.response) {
        const errorMsg = error.response.data.errors?.join(", ") || error.response.data.error;
        
        if (errorMsg.includes('CSRF') || error.response.status === 403) {
          // CSRF error - refresh token and show message
          setCsrfReady(false);
          await getCsrfToken();
          setCsrfReady(true);
          setMessage("Security token expired. Please try registering again.");
        } else {
          setMessage("Registration failed: " + errorMsg);
        }
      } else if (error.request) {
        setMessage("Network error. Please check your connection.");
      } else {
        setMessage("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="register-container">
        {/* Left Image */}
        <div className="register-left">
          <img
            src="/register-image.jpg"
            alt="Payment Illustration"
            className="register-image"
          />
          {!csrfReady && (
          <div className="loading-overlay">
            <p>Initializing security...</p>
          </div>
        )}
        
        </div>
  
        {/* Right Side */}
        <div className="register-right">
          {/* Background particles */}
          <div className="particles">
            {particles.map((p, i) => (
              <span
                key={i}
                className="particle"
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  left: `${p.left}%`,
                  animationDuration: `${p.duration}s`,
                  animationDelay: `${p.delay}s`,
                  "--sway": `${p.sway}px`,
                  "--opacity": Math.random() * 0.3 + 0.3,
                }}
              ></span>
            ))}
          </div>
  
          {/* Register Card */}
          <div className="register-card">
            <h2>Create an Account</h2>
            <form onSubmit={handleSubmit}>
              {/* Full Name Input */}
              <div className="input-group">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={form.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {errors.fullName && <p className="error-text">{errors.fullName}</p>}
              </div>
  
              {/* ID Number Input */}
              <div className="input-group">
                <input
                  type="text"
                  name="idNumber"
                  placeholder="ID Number"
                  value={form.idNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {errors.idNumber && <p className="error-text">{errors.idNumber}</p>}
              </div>
  
              {/* Account Number Input */}
              <div className="input-group">
                <input
                  type="text"
                  name="accountNumber"
                  placeholder="Account Number"
                  value={form.accountNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {errors.accountNumber && <p className="error-text">{errors.accountNumber}</p>}
              </div>
  
              {/* Password Input */}
              <div className="input-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {errors.password && <p className="error-text">{errors.password}</p>}
              </div>
  
              <button type="submit">Register</button>
            </form>
  
            {/* General message */}
            {message && <p className="form-message">{message}</p>}
          </div>
        </div>
      </div>
    </>
  );
  
};

export default Register;