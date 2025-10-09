import { useState } from "react";
import { useNavigate } from "react-router-dom"; // <-- import useNavigate
import api from "../api/api";
import "../styles/FormLayout.css";

function Login() {
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // <-- initialize navigate

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { accountNumber, password });
      setMessage("Login successful!");
      localStorage.setItem("accessToken", res.data.accessToken); // make sure this matches backend

      // Redirect to Payments page
      navigate("/payment");
    } catch (err) {
      setMessage("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="full-width-container">
      <div className="form-card">
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
  );
}

export default Login;
