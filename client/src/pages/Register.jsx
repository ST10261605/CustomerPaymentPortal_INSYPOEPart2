import React, { useState } from "react";
import "../styles/FormLayout.css";
import api from "../api/api";


const Register = () => {
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
    const response = await api.post("/auth/register", form);
    console.log("Registration successful:", response.data);
    alert("Registration successful!");
    navigate("/login");
  } catch (error) {
     if (error.response) {
    console.error("Backend error:", error.response.data);
    alert("Registration failed: " + (error.response.data.errors?.join(", ") || error.response.data.error));
  } else {
    console.error("Request error:", error);
    alert("Registration failed. Please try again.");
    }
  }
};


  return (
    <div className="full-width-container">
      <div className="form-card">
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
  );
};

export default Register;
