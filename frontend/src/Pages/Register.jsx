import React, { useState } from "react";
import{ useNavigate} from "react-router-dom";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Registration details:", form);
  };

  return (
    <div className="register-page">
      <div className="register-card">

        {/* Scout Logo */}
        <div className="scout-brand">
        <div className="scout-logo">S</div>
        <span>Scout</span>
        </div>

        {/* Heading */}
        <h1>Create your account</h1>

        <p className="subtitle">
        Join Scout and discover opportunities made for you.
        </p>

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>

          {/* Full Name */}
          <div className="form-group">
            <label>Full name</label>

            <input
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email address</label>

            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          {/* Passwords */}
          <div className="password-row">

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Confirm password</label>

              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </div>

          </div>

          {/* Create Account Button */}
          <button type="button" className="create-account-btn" onClick={() => navigate("/profile")}>
            Create account
          </button>

        </form>

        {/* Verification Message */}
        <div className="verification-message">
          We'll send a verification link to your email.
          You'll need to confirm it before applying to anything.
        </div>

        {/* Login */}
        <p className="login-text">
          Already have an account?
          <span className="login-link"> Log in</span>
        </p>

      </div>
    </div>
  );
}
