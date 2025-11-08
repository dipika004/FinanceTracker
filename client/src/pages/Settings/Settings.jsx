import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [signUpData, setSignUpData] = useState({ name: "", email: "", password: "" });
  const [onboardingData, setOnboardingData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return navigate("/login");

    const fetchSettings = async () => {
      try {
        const signUpRes = await axios.get("https://financetracker-backend-tv60.onrender.com/api/auth/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSignUpData({ ...signUpRes.data, password: "" });

        const onboardingRes = await axios.get("https://financetracker-backend-tv60.onrender.com/api/auth/onboarding", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOnboardingData(onboardingRes.data);
      } catch (err) {
        console.error(err);
        alert("Error fetching settings. Please login again.");
        localStorage.clear();
        navigate("/login");
      }
    };

    fetchSettings();
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in onboardingData) {
      setOnboardingData({ ...onboardingData, [name]: value });
    } else {
      setSignUpData({ ...signUpData, [name]: value });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (signUpData.password) {
        await axios.put(
          "https://financetracker-backend-tv60.onrender.com/api/auth/user",
          { password: signUpData.password },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      await axios.put(
        "https://financetracker-backend-tv60.onrender.com/api/auth/onboarding",
        onboardingData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Settings updated successfully!");
      setEditMode(false);
      setSignUpData({ ...signUpData, password: "" });
    } catch (err) {
      console.error(err);
      alert("Error updating settings. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="container py-5">
      <h2 className="mb-5 text-center fw-bold text-primary">Settings</h2>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-lg border-0 rounded-4 p-4 p-md-5">
            <h4 className="mb-4 fw-semibold text-secondary">👤 Account Information</h4>
            <div className="mb-3">
              <label className="form-label fw-medium">Full Name</label>
              <input type="text" name="name" value={signUpData.name} readOnly className="form-control rounded-3" />
            </div>
            <div className="mb-3">
              <label className="form-label fw-medium">Email</label>
              <input type="email" name="email" value={signUpData.email} readOnly className="form-control rounded-3" />
            </div>

            {editMode && (
              <div className="mb-3">
                <label className="form-label fw-medium">New Password</label>
                <input
                  type="password"
                  name="password"
                  value={signUpData.password}
                  onChange={handleChange}
                  className="form-control rounded-3"
                  placeholder="Enter new password"
                />
              </div>
            )}

            <hr className="my-4" />

            <h4 className="mb-4 fw-semibold text-secondary">💰 Onboarding Information</h4>
            <div className="row g-3">
              {Object.entries(onboardingData).map(([key, value]) => {
                if (["_id", "userId", "mainExpenses","__v"].includes(key)) return null;

                return (
                  <div key={key} className="col-md-6">
                    <label className="form-label text-capitalize fw-medium">{key.replace(/([A-Z])/g, " $1")}</label>
                    <input
                      type={key === "monthlyIncome" || key === "monthlyExpenses" ? "number" : "text"}
                      name={key}
                      value={value}
                      onChange={handleChange}
                      className="form-control rounded-3"
                      readOnly={!editMode}
                    />
                  </div>
                );
              })}
            </div>

            <div className="d-flex flex-wrap gap-3 mt-4 justify-content-end">
              {!editMode ? (
                <button className="btn btn-primary btn-lg px-4" onClick={() => setEditMode(true)}>Edit</button>
              ) : (
                <button className="btn btn-success btn-lg px-4" onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              )}
              <button className="btn btn-outline-danger btn-lg px-4" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
