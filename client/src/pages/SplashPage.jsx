import "../styles/SplashPage.css"; // correct relative path
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaGlobeAmericas } from "react-icons/fa"; // spinning globe icon

export default function SplashPage() {
  const navigate = useNavigate();

  return (
    <div className="splash-container">
      <motion.div
        className="splash-content"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="splash-icon"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        >
          <FaGlobeAmericas size={60} color="#A1C2BD" />
        </motion.div>

        <h1 className="splash-title">Customer Payment Portal</h1>
        <p className="splash-description">
          Seamlessly manage your international payments with security,
          transparency, and speed.
        </p>

        <div className="splash-buttons">
          <button className="splash-btn" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="splash-btn" onClick={() => navigate("/register")}>
            Register
          </button>
        </div>
      </motion.div>
    </div>
  );
}
