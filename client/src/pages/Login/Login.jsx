import React, { useState } from "react";
import lakshmiGod from "../../assets/lakshmiGod.png";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("https://financetracker-backend-tv60.onrender.com/api/auth/login", formData);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("name", response.data.user?.name || "");
      localStorage.setItem("userId", response.data.id?.id || "");
      alert(response.data.message || "Login successful");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Floating animated background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="container-fluid h-100">
        <div className="row h-100 align-items-center justify-content-center gx-0">
          {/* Left Side */}
          <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center px-4 py-5">
            <div className="text-center">
              <img src={lakshmiGod} alt="LakshmiLoop" className="hero-image" />
              <h1 className="brand-name mt-3">LakshmiLoop</h1>
              <p className="brand-tagline text-muted">
                Manage your wealth with divine precision
              </p>
            </div>
          </div>

          {/* Right Side */}
          <div className="col-12 col-lg-5 d-flex align-items-center justify-content-center px-4 py-5">
            <div className="login-card p-4 p-md-5 rounded-4 shadow-sm w-100">
              <h2 className="mb-2 fw-bold text-center">Welcome Back</h2>
              <p className="text-center text-muted mb-4">
                Sign in to continue to LakshmiLoop
              </p>

              <form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: 460 }}>
                <div className="mb-3 form-floating">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control form-control-lg"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="email">Email address</label>
                </div>

                <div className="mb-3 form-floating">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-control form-control-lg"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="password">Password</label>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="remember" />
                    <label className="form-check-label" htmlFor="remember">Remember me</label>
                  </div>
                  <Link to="/reset-pass" className="small text-decoration-none">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 btn-lg fw-semibold"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

                <div className="mt-3 text-center">
                  <small className="text-muted">Don’t have an account?</small>{" "}
                  <Link to="/signup" className="ms-1 text-decoration-none fw-semibold">
                    Sign Up
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
