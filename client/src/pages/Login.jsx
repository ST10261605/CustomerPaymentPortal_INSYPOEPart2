import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/Login.css";

function Login() {
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { accountNumber, password });
      setMessage("Login successful!");
      localStorage.setItem("accessToken", res.data.accessToken);
      navigate("/home");
    } catch (err) {
      setMessage("Login failed. Please check your credentials.");
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
            <input
              type="text"
              placeholder="Account Number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
          {message && <p className="form-message">{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default Login;
