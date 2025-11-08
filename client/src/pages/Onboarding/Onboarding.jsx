import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Onboarding() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    incomeRange: "",
    monthlyIncome: "",
    monthlyExpenses: "",
    savings: "",
    mainExpenses: [],
    financialExperience: "",
    shortTermGoals: "",
    longTermGoals: "",
    currency: "",
    notifications: [],
  });

  const [loading, setLoading] = useState(false);

  // Prefill name if available
  useEffect(() => {
    const signupName = localStorage.getItem("name");
    if (signupName) {
      setFormData((prev) => ({ ...prev, name: signupName }));
    }
  }, []);

  // handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "monthlyIncome" || name === "monthlyExpenses") {
      const updated = { ...formData, [name]: value };
      updated.savings =
        (Number(updated.monthlyIncome) || 0) -
        (Number(updated.monthlyExpenses) || 0);
      setFormData(updated);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
        ? [...formData[name], value]
        : formData[name].filter((item) => item !== value),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.monthlyIncome || !formData.monthlyExpenses) {
      alert("Please enter both monthly income and expenses");
      return;
    }
    setLoading(true);

    try {
      const response = await axios.post(
        "https://financetracker-backend-tv60.onrender.com/api/auth/onboarding",
        formData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      alert(response.data.message);
      localStorage.setItem("monthlyIncome", formData.monthlyIncome);
      localStorage.setItem("monthlyExpenses", formData.monthlyExpenses);
      localStorage.setItem("savings", formData.savings);
      localStorage.setItem("currency", formData.currency);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="card shadow-lg border-0 rounded-4">
        <div className="card-body p-5">
          <h2 className="text-center mb-3 text-primary fw-bold">
            Personalize Your Dashboard
          </h2>
          <p className="text-center text-muted mb-4">
            Just a few questions to tailor your financial insights.
          </p>

          <form onSubmit={handleSubmit} className="needs-validation">
            {/* About You */}
            <div className="mb-4">
              <h4 className="text-secondary mb-3">👤 About You</h4>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    readOnly
                    className="form-control bg-light"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Age Range</label>
                  <select
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select Age Range</option>
                    <option value="18-25">18-25</option>
                    <option value="26-35">26-35</option>
                    <option value="36-45">36-45</option>
                    <option value="46-60">46-60</option>
                    <option value="60+">60+</option>
                  </select>
                </div>
              </div>
            </div>

            <hr />

            {/* Finances */}
            <div className="mb-4">
              <h4 className="text-secondary mb-3">💰 Your Finances</h4>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Approximate Annual Income</label>
                  <select
                    name="incomeRange"
                    value={formData.incomeRange}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select</option>
                    <option value="0-3 LPA">0-3 LPA</option>
                    <option value="3-6 LPA">3-6 LPA</option>
                    <option value="6-10 LPA">6-10 LPA</option>
                    <option value="10-15 LPA">10-15 LPA</option>
                    <option value="15+ LPA">15+ LPA</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Preferred Currency</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select Currency</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                </div>
              </div>

              <div className="row g-3 mt-2">
                <div className="col-md-6">
                  <label className="form-label">Monthly Income (₹)</label>
                  <input
                    type="number"
                    name="monthlyIncome"
                    value={formData.monthlyIncome}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter monthly income"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Monthly Expenses (₹)</label>
                  <input
                    type="number"
                    name="monthlyExpenses"
                    value={formData.monthlyExpenses}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter monthly expenses"
                  />
                </div>
              </div>

              <div className="alert alert-info mt-3 mb-0">
                <strong>Estimated Monthly Savings:</strong>{" "}
                ₹{formData.savings || 0}
              </div>

              <div className="mt-4">
                <h6 className="fw-semibold">Main Expense Categories</h6>
                <div className="d-flex flex-wrap gap-3">
                  {["Food", "Transport", "Bills", "Shopping", "Entertainment", "Others"].map(
                    (item) => (
                      <div className="form-check" key={item}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="mainExpenses"
                          value={item}
                          checked={formData.mainExpenses.includes(item)}
                          onChange={handleCheckboxChange}
                          id={item}
                        />
                        <label className="form-check-label" htmlFor={item}>
                          {item}
                        </label>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="mt-4">
                <h6 className="fw-semibold">Financial Experience</h6>
                <div className="d-flex gap-4">
                  {["Beginner", "Intermediate", "Expert"].map((level) => (
                    <div className="form-check" key={level}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="financialExperience"
                        value={level}
                        checked={formData.financialExperience === level}
                        onChange={handleChange}
                        id={level}
                      />
                      <label className="form-check-label" htmlFor={level}>
                        {level}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <hr />

            {/* Goals */}
            <div className="mb-4">
              <h4 className="text-secondary mb-3">🎯 Financial Goals</h4>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Short-term Goals</label>
                  <input
                    type="text"
                    name="shortTermGoals"
                    value={formData.shortTermGoals}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Eg: Buy a phone, pay off credit card"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Long-term Goals</label>
                  <input
                    type="text"
                    name="longTermGoals"
                    value={formData.longTermGoals}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Eg: Buy a home, retirement savings"
                  />
                </div>
              </div>
            </div>

            <hr />

            {/* Notifications */}
            <div className="mb-4">
              <h4 className="text-secondary mb-3">🔔 Notifications</h4>
              <div className="d-flex gap-3 flex-wrap">
                {["Email", "SMS", "Push"].map((type) => (
                  <div className="form-check" key={type}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="notifications"
                      value={type}
                      checked={formData.notifications.includes(type)}
                      onChange={handleCheckboxChange}
                      id={type}
                    />
                    <label className="form-check-label" htmlFor={type}>
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg px-5 rounded-pill"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
