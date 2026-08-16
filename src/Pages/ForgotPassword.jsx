import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = (e) => {
    e.preventDefault();

    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (!savedUser) {
      setMessage("No account found. Please register first.");
      return;
    }

    if (email !== savedUser.email) {
      setMessage("No account found with this email address.");
      return;
    }

    const updatedUser = {
      ...savedUser,
      password: newPassword,
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));

    setMessage("Password reset successfully!");

    setTimeout(() => {
      navigate("/signin");
    }, 1500);
  };

  return (
    <div className="forgot-page">

      <div className="forgot-card">

        <div className="forgot-brand">
          <div className="forgot-logo">S</div>
          <span>Scout</span>
        </div>

        <div className="forgot-heading">
          <h1>Reset your password</h1>
          <p>
            Enter your email and create a new password.
          </p>
        </div>

        <form onSubmit={handleReset}>

          <div className="forgot-field">
            <label>Email address</label>

            <input
              type="email"
              placeholder="you@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="forgot-field">
            <label>New password</label>

            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>

          <button
            type="submit"
            className="reset-password-button"
          >
            Reset password
          </button>

        </form>

        {message && (
          <p className="reset-message">
            {message}
          </p>
        )}

        <button
          className="back-login-button"
          onClick={() => navigate("/signin")}
        >
          ← Back to login
        </button>

      </div>

    </div>
  );
}

export default ForgotPassword;