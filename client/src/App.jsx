// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Payment from "./pages/Payment";
import SplashPage from "./pages/SplashPage";
import Home from "./pages/Home";
import Review from './pages/PaymentReview'; 



function App() {
  return (
    <Router>
      {/* <Navbar /> */}
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/review" element={<Review />} /> 
        <Route path="/home" element={<Home/>} />
      </Routes>
    </Router>
  );
}

export default App;
