import React, { useState } from "react";
import "../styles/Register.css";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    idNumber: "",
    accountNumber: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", form);
      alert("Registration successful!");
      navigate("/login");
    } catch (error) {
      if (error.response) {
        alert(
          "Registration failed: " +
            (error.response.data.errors?.join(", ") || error.response.data.error)
        );
      } else {
        alert("Registration failed. Please try again.");
      }
    }
  };

  // Generate random particle styles
  const particles = Array.from({ length: 25 }).map(() => {
    const size = Math.random() * 8 + 4; // 4px to 12px
    const left = Math.random() * 100; // 0% to 100%
    const duration = Math.random() * 10 + 10; // 10s to 20s
    const delay = Math.random() * 5; // 0s to 5s
    const sway = Math.random() * 20 + 5; // 5px to 25px horizontal sway

    return { size, left, duration, delay, sway };
  });

  return (
    <div className="register-container">
      <div className="register-left">
        <img
          src="/register-image.jpg"
          alt="Payment Illustration"
          className="register-image"
        />
      </div>

      <div className="register-right">
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
              '--sway': `${p.sway}px`,
              '--opacity': Math.random() * 0.3 + 0.3, // random starting opacity
            }}
        ></span>
      ))}
      </div>

        <div className="register-card">
          <h2>Create an Account</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={form.fullName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="idNumber"
              placeholder="ID Number"
              value={form.idNumber}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="accountNumber"
              placeholder="Account Number"
              value={form.accountNumber}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button type="submit">Register</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
