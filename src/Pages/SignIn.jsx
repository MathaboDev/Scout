import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignIn.css";

export default function SignIn() {
  const navigate = useNavigate();

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

  const savedUser = JSON.parse(localStorage.getItem("user"));

  if (!savedUser) {
    alert("No account found. Please register first.");
    return;
  }

  if (
    form.email === savedUser.email &&
    form.password === savedUser.password
  ) {
    navigate("/profile");
  } else {
    alert("Incorrect email or password.");
  }
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
              onClick={() => navigate("/forgot-password")}
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
            onClick={() => navigate("/register")}
          > Sign up </button>
        </p>

      </div>
    </div>
  );
}