// src/pages/AdminHome.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import Navbar from "../components/Navbar";

const AdminHome = () => {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      <Navbar />

      <div className="home-container">
        <motion.div
          className="glow-behind"
          animate={{ x: mousePos.x * 40, y: mousePos.y * 40 }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        />

        <motion.div
          className="home-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <h1 className="hero-title">Admin Dashboard</h1>
          <p className="hero-description">
            Manage employees, review payments, and oversee system activity — all from one secure hub.
          </p>

          <div className="hero-buttons">
            <motion.button
              className="cta-button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/admin/register-employee")}
            >
              Register Employee
            </motion.button>

            <motion.button
              className="cta-button outline"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/admin/review-payments")}
            >
              Review Payments
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default AdminHome;
