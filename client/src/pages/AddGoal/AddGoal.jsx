import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaBullseye,
  FaCalendarAlt,
  FaRupeeSign,
  FaStar,
  FaStickyNote,
} from "react-icons/fa";

export default function AddGoal() {
  const [form, setForm] = useState({
    goalName: "",
    targetAmount: "",
    savedSoFar: "",
    deadline: "",
    priority: "Medium",
    notes: "",
  });

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:8080/api/goals/add", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("🎯 Goal added successfully!");
      navigate("/goals");
    } catch (err) {
      console.error("Error adding goal:", err);
      if (err.response?.status === 401) {
        alert("Login time out. Please login again.");
        localStorage.clear();
        navigate("/login");
      } else {
        alert("Failed to add goal");
      }
    }
  };

  return (
    <div
      className="min-vh-100 d-flex justify-content-center align-items-center px-3"
      style={{
        background: "radial-gradient(circle at top left, #0f172a, #020617)",
      }}
    >
      <div
        className="p-5 shadow-lg w-100"
        style={{
          maxWidth: "600px",
          background: "rgba(15, 23, 42, 0.7)",
          borderRadius: "25px",
          backdropFilter: "blur(25px)",
          boxShadow: "0 0 40px rgba(56,189,248,0.15)",
          color: "#f1f5f9",
        }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <h2
            className="fw-bold mb-2"
            style={{
              background: "linear-gradient(90deg, #38bdf8, #22d3ee, #0ea5e9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: "2.1rem",
              letterSpacing: "1px",
            }}
          >
            <FaBullseye className="me-2 text-info" />
            Add a New Goal
          </h2>
          <p style={{ color: "#cbd5e1" }}>
            Define your target & start your journey toward financial growth 💸
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
          {[ // Input fields
            {
              name: "goalName",
              label: "Goal Name",
              icon: <FaBullseye />,
              type: "text",
              placeholder: "🎯 e.g., Buy a new laptop",
            },
            {
              name: "targetAmount",
              label: "Target Amount (₹)",
              icon: <FaRupeeSign />,
              type: "number",
              placeholder: "💰 e.g., 50000",
            },
            {
              name: "savedSoFar",
              label: "Saved So Far (₹)",
              icon: <FaRupeeSign />,
              type: "number",
              placeholder: "💸 e.g., 2000",
            },
          ].map((field) => (
            <div key={field.name}>
              <label className="text-info fw-semibold">{field.label}</label>
              <div className="input-group mt-1">
                <span className="input-group-text bg-transparent border-0 text-info fs-5">
                  {field.icon}
                </span>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  required={field.name !== "savedSoFar"}
                  className="form-control border-0 bg-transparent text-light border-bottom border-info-subtle rounded-0 input-glow"
                  placeholder={field.placeholder}
                />
              </div>
            </div>
          ))}

          {/* Deadline */}
          <div>
            <label className="text-info fw-semibold">Deadline</label>
            <div className="input-group mt-1">
              <span className="input-group-text bg-transparent border-0 text-info fs-5">
                <FaCalendarAlt />
              </span>
              <input
                type="date"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                required
                className="form-control border-0 bg-transparent text-light border-bottom border-info-subtle rounded-0 input-glow"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-info fw-semibold">Priority</label>
            <div className="input-group mt-1">
              <span className="input-group-text bg-transparent border-0 text-info fs-5">
                <FaStar />
              </span>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="form-select border-0 bg-transparent text-light border-bottom border-info-subtle rounded-0 input-glow"
              >
                <option value="High">High 🔥</option>
                <option value="Medium">Medium ⚡</option>
                <option value="Low">Low 🕐</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-info fw-semibold">Notes (optional)</label>
            <div className="input-group mt-1">
              <span className="input-group-text bg-transparent border-0 text-info fs-5">
                <FaStickyNote />
              </span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="form-control border-0 bg-transparent text-light border-bottom border-info-subtle rounded-0 input-glow"
                placeholder="📝 Any thoughts or remarks about your goal..."
                rows="3"
              ></textarea>
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="btn fw-bold py-2 mt-3"
            style={{
              background: "linear-gradient(90deg, #38bdf8, #22d3ee, #0ea5e9)",
              border: "none",
              borderRadius: "12px",
              color: "#0f172a",
              boxShadow: "0 0 15px rgba(34,211,238,0.5)",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 0 25px rgba(56,189,248,0.8)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 0 15px rgba(34,211,238,0.5)")
            }
          >
            + Add Goal
          </button>
        </form>
      </div>

      {/* Custom Styling */}
      <style>{`
        ::placeholder {
          color: #7dd3fc !important; /* Bright cyan placeholder */
          font-weight: 500;
          opacity: 1 !important; /* Full visibility */
        }

        .input-glow:focus {
          box-shadow: 0 2px 10px rgba(56, 189, 248, 0.5);
          border-bottom: 2px solid #38bdf8 !important;
          outline: none;
          transition: all 0.3s ease;
        }

        .form-control,
        .form-select {
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}
