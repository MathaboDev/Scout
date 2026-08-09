import React, { useState } from "react";
import "./SignIn.css";

export default function SignIn() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Login:", form);
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Scout Logo */}
        <div className="login-brand">
          <div className="login-logo">S</div>
          <span>Scout</span>
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h1>Welcome back</h1>
          <p>Sign in to continue to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Email */}
          <div className="login-field">
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              type="email"
              placeholder="you@gmail.com"
              value={form.email}
              onChange={handleChange("email")}
              required
            />
          </div>

          {/* Password */}
          <div className="login-field">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange("password")}
              required
            />
          </div>

          {/* Forgot Password */}
          <div className="forgot-password">
            <button
              type="button"
              onClick={() => console.log("Forgot password")}
            >
              Forgot password?
            </button>
          </div>

          {/* Login Button */}
          <button type="submit" className="login-button">
            Log in
          </button>

        </form>

        {/* Sign Up */}
        <p className="signup-text">
          Don't have an account?{" "}
          <button
            type="button"
            className="signup-link"
            onClick={() => console.log("Go to sign up")}
          >
            Sign up
          </button>
        </p>

      </div>
    </div>
  );
}