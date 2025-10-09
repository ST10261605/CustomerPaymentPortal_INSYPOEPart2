import { useState } from "react";
import api from "../api/api";
import "../styles/Payment.css";

function Payment() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [provider, setProvider] = useState("SWIFT");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePayment = async (e) => {
    e.preventDefault();

    const amountNum = parseFloat(amount);
    const accountRegex = /^\d{6,20}$/;
    const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

    if (isNaN(amountNum) || amountNum <= 0) {
      setMessage("Please enter a valid amount.");
      setIsSuccess(false);
      return;
    }

    if (!accountRegex.test(recipientAccount)) {
      setMessage("Recipient account number is invalid.");
      setIsSuccess(false);
      return;
    }

    if (!swiftRegex.test(swiftCode)) {
      setMessage("SWIFT code is invalid.");
      setIsSuccess(false);
      return;
    }

    try {
      const res = await api.post("/payment", {
        amount: amountNum,
        currency,
        provider,
        recipientAccount,
        swiftCode,
      });

      setMessage(`Payment successful! Transaction ID: ${res.data.transactionId}`);
      setIsSuccess(true);

      setAmount("");
      setRecipientAccount("");
      setSwiftCode("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Payment failed. Please try again.");
      setIsSuccess(false);
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-card">
        <h2 className="payment-title">International Payment Portal</h2>

        {message && (
          <div className={isSuccess ? "payment-success" : "payment-errors"}>
            <p>{message}</p>
          </div>
        )}

        <form onSubmit={handlePayment}>
          <label>Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />

          <label>Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="ZAR">ZAR</option>
          </select>

          <label>Payment Provider</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="SWIFT">SWIFT</option>
            {/* Add more providers here */}
          </select>

          <label>Recipient Account Number</label>
          <input
            type="text"
            value={recipientAccount}
            onChange={(e) => setRecipientAccount(e.target.value)}
            placeholder="1234567890"
            required
          />

          <label>SWIFT Code</label>
          <input
            type="text"
            value={swiftCode}
            onChange={(e) => setSwiftCode(e.target.value)}
            placeholder="BANKUS33"
            required
          />

          <button className="payment-button" type="submit">Pay Now</button>
        </form>
      </div>
    </div>
  );
}

export default Payment;
