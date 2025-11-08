import { useState } from "react";
import lakshmiGod from "../../assets/lakshmiGod.png";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./SignUp.css"; // <-- Add the magic here!

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("https://financetracker-backend-tv60.onrender.com/api/auth/register", formData);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("name", formData.name);
      alert(response.data.message);
      setFormData({ name: "", email: "", password: "", confirmPassword: "" });
      setLoading(false);
      navigate("/onboarding");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrapper">
      {/* Background Decorative Layer */}
      <div className="animated-background"></div>
      <div className="floating-orbs">
        <span className="orb orb1"></span>
        <span className="orb orb2"></span>
        <span className="orb orb3"></span>
      </div>

      {/* Main Content */}
      <div className="d-flex flex-column flex-lg-row align-items-center justify-content-center min-vh-100 position-relative">
        {/* Left Side (Image) */}
        <div className="col-lg-6 d-flex flex-column align-items-center justify-content-center text-center p-5">
          <h2 className="fw-bold mb-4 text-gradient">LakshmiLoop</h2>
          <div className="image-container">
            <img
              src={lakshmiGod}
              alt="Lakshmi God"
              className="img-fluid glow-image"
            />
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="col-lg-5 bg-white rounded-5 shadow-lg p-5 m-3 form-box">
          <div className="text-center mb-4">
            <h3 className="fw-bold text-gradient">Create your account</h3>
            <p className="text-muted">
              Join LakshmiLoop and track your money with ease ✨
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="text"
                name="name"
                className="form-control rounded-pill shadow-sm"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <input
                type="email"
                name="email"
                className="form-control rounded-pill shadow-sm"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <input
                type="password"
                name="password"
                className="form-control rounded-pill shadow-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-4">
              <input
                type="password"
                name="confirmPassword"
                className="form-control rounded-pill shadow-sm"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn w-100 rounded-pill fw-bold text-white gradient-btn"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center mt-4">
            Already have an account?{" "}
            <Link to="/login" className="fw-bold link-highlight">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
