import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/Login.css";

function Login() {
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({ accountNumber: "", password: "" });
  const [particles, setParticles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Generate smooth floating particles on right side
    const particleArray = Array.from({ length: 35 }, () => ({
      size: Math.random() * 6 + 3,
      left: Math.random() * 100,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
      sway: Math.random() * 60 - 30,
    }));
    setParticles(particleArray);
  }, []);

  // Inline field validation
  const validateField = (name, value) => {
    let error = "";

    if (name === "accountNumber") {
      if (!/^\d{8,12}$/.test(value)) {
        error = "Account number must be between 8 and 12 digits.";
      }
    }

    if (name === "password") {
      if (value.trim() === "") {
        error = "Password cannot be empty.";
      } else if (value.length < 8) {
        error = "Password must be at least 8 characters long.";
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Validate before submitting
  const handleLogin = async (e) => {
    e.preventDefault();

    const newErrors = {
      accountNumber:
        !/^\d{8,12}$/.test(accountNumber)
          ? "Account number must be between 8 and 12 digits."
          : "",
      password:
        password.trim() === ""
          ? "Password cannot be empty."
          : password.length < 8
          ? "Password must be at least 8 characters long."
          : "",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((msg) => msg)) {
      setMessage("Login failed! Please fix the following errors before logging in.");
      return;
    }

    try {
      const res = await api.post("/auth/login", { accountNumber, password });
      setMessage("Login successful!");

      localStorage.setItem("accessToken", res.data.accessToken);

  if (res.data && res.data.user) {
    localStorage.setItem("user", JSON.stringify(res.data.user));
  }
      
      navigate("/home");
    } catch (err) {
    // Handle different error types
    if (err.response) {
      // Server responded with error status
      if (err.response.status === 429) {
        // Rate limit exceeded
        setMessage(err.response.data?.message || "Too many login attempts. Please try again in 15 minutes.");
      } else if (err.response.status === 401) {
        // Invalid credentials
        setMessage("Login failed! Invalid credentials.");
      } else {
        // Other server errors
        setMessage("Login failed! Please try again.");
      }
    } else if (err.request) {
      // Network error (no response received)
      setMessage("Network error. Please check your connection.");
    } else {
      // Other errors
      setMessage("An unexpected error occurred.");
    }
  }
};

  return (
    <div className="login-container">
      {/* Left side image */}
      <div className="login-left">
        <div className="overlay"></div>
        <img
          src="/register-image.jpg"
          alt="Payments background"
          className="login-image"
        />
        <div className="left-text">
          <h1>Welcome Back</h1>
          <p>Manage your payments effortlessly and securely.</p>
        </div>
      </div>

      {/* Right side form */}
      <div className="login-right">
        {/* Floating particles */}
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
              }}
            ></span>
          ))}
        </div>

        <div className="login-card">
          <h2>Login</h2>

          <form onSubmit={handleLogin}>
            {/* Account Number */}
            <div className="input-group">
              <input
                type="text"
                placeholder="Account Number"
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value);
                  validateField("accountNumber", e.target.value);
                }}
                onBlur={(e) => validateField("accountNumber", e.target.value)}
                required
              />
              {errors.accountNumber && (
                <p className="error-text">{errors.accountNumber}</p>
              )}
            </div>

            {/* Password */}
            <div className="input-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validateField("password", e.target.value);
                }}
                onBlur={(e) => validateField("password", e.target.value)}
                required
              />
              {errors.password && (
                <p className="error-text">{errors.password}</p>
              )}
            </div>

            <button type="submit">Login</button>
          </form>

          {/* General message */}
          {message && <p className="form-message">{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default Login;