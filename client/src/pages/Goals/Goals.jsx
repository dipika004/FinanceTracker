import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Target, PlusCircle } from "lucide-react";

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchGoals() {
      if (!token) {
        alert("Login time out. Please login again");
        localStorage.clear();
        navigate("/login");
        return;
      }
      try {
        const res = await axios.get("http://localhost:8080/api/goals", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGoals(res.data);
      } catch (err) {
        console.error("Error fetching goals:", err);
        if (err.response?.status === 401) {
          alert("Login time out. Please login again");
          localStorage.clear();
          navigate("/login");
        }
      }
    }
    fetchGoals();
  }, [token, navigate]);

  const getPriorityBadge = (priority) => {
    switch ((priority || "").toLowerCase()) {
      case "high":
        return "badge bg-danger bg-opacity-75 shadow";
      case "medium":
        return "badge bg-warning text-dark bg-opacity-75 shadow";
      case "low":
        return "badge bg-success bg-opacity-75 shadow";
      default:
        return "badge bg-secondary";
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this goal?")) return;
    try {
      await axios.delete(`http://localhost:8080/api/goals/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGoals(goals.filter((g) => g._id !== id));
      showCustomToast("🗑️ Goal deleted successfully");
    } catch (err) {
      console.error("Error deleting goal:", err);
      alert("Failed to delete goal");
    }
  };

  const handleAddSavings = async (id, amount) => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert("Enter a valid number");
      return;
    }
    try {
      await axios.put(
        `http://localhost:8080/api/goals/add-savings/${id}`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGoals((prev) =>
        prev.map((g) =>
          g._id === id
            ? { ...g, savedSoFar: g.savedSoFar + Number(amount) }
            : g
        )
      );
      showCustomToast("💰 Money added successfully!");
    } catch (err) {
      console.error("Error adding savings:", err);
      alert("Failed to add savings");
    }
  };

  const showCustomToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getMonthsLeft = (deadline) => {
    const now = new Date();
    const end = new Date(deadline);
    const diffYears = end.getFullYear() - now.getFullYear();
    const diffMonths = end.getMonth() - now.getMonth();
    const totalMonths = diffYears * 12 + diffMonths;
    return totalMonths > 0 ? totalMonths : 0;
  };

  // --- Group goals by priority ---
  const priorities = ["high", "medium", "low"];
  const groupedGoals = priorities.map((p) => ({
    priority: p,
    goals: goals
      .filter((g) => (g.priority || "").toLowerCase() === p)
      .sort(
        (a, b) =>
          b.savedSoFar / b.targetAmount - a.savedSoFar / a.targetAmount // sort by progress
      ),
  }));

  return (
    <div
      className="min-vh-100 py-5 position-relative"
      style={{
        background: "linear-gradient(135deg, #0f172a, #1e293b, #0b1120)",
        color: "white",
        overflowX: "hidden",
      }}
    >
      <div className="container">
        {/* --- Toast --- */}
        {showToast && (
          <div
            className="position-fixed top-0 end-0 p-3"
            style={{ zIndex: 1055 }}
          >
            <div
              className="toast show align-items-center text-bg-success border-0 shadow-lg"
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
              style={{
                background:
                  "linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))",
                borderRadius: "10px",
              }}
            >
              <div className="d-flex">
                <div className="toast-body fw-semibold">{toastMessage}</div>
                <button
                  type="button"
                  className="btn-close btn-close-white me-2 m-auto"
                  onClick={() => setShowToast(false)}
                ></button>
              </div>
            </div>
          </div>
        )}

        {/* --- Header Section --- */}
        <div className="text-center mb-5">
          <div className="d-inline-flex align-items-center justify-content-center gap-3 mb-2">
            <Target size={42} color="#38bdf8" />
            <h2
              className="fw-bold mb-0"
              style={{
                background: "linear-gradient(90deg, #38bdf8, #22d3ee, #67e8f9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: "2.5rem",
              }}
            >
              My Smart Financial Goals
            </h2>
          </div>
          <p className="text-secondary fs-6">
            Track, plan, and grow your savings — stay focused on your dreams 💸
          </p>
        </div>

        {/* --- Goals Display by Priority --- */}
        {goals.length === 0 ? (
          <div className="text-center text-light opacity-75 mt-5">
            <p>No goals added yet. Start your first goal to begin your journey 🚀</p>
            <Link
              to="/add-goal"
              className="btn btn-info fw-semibold mt-3 px-4 py-2 shadow"
            >
              <PlusCircle className="me-2" size={18} />
              Add Your First Goal
            </Link>
          </div>
        ) : (
          groupedGoals.map((group) => (
            <div key={group.priority} className="mb-5">
              <h3
                className={`mb-4 text-uppercase fw-bold ${
                  group.priority === "high"
                    ? "text-danger"
                    : group.priority === "medium"
                    ? "text-warning"
                    : "text-success"
                }`}
                style={{ borderBottom: "2px solid", paddingBottom: "5px" }}
              >
                {group.priority.charAt(0).toUpperCase() + group.priority.slice(1)} Priority
              </h3>
              <div className="row g-4">
                {group.goals.map((goal) => {
                  const progress = Math.min(
                    (goal.savedSoFar / goal.targetAmount) * 100,
                    100
                  );
                  const monthsLeft = getMonthsLeft(goal.deadline);

                  return (
                    <div className="col-md-6 col-lg-4" key={goal._id}>
                      <div
                        className="card border-0 text-light shadow-lg h-100"
                        style={{
                          background:
                            "linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.9))",
                          borderRadius: "18px",
                          transition: "transform 0.3s ease, box-shadow 0.3s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.02)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h4 className="fw-semibold mb-1">
                                {goal.goalName}{" "}
                                <span className={getPriorityBadge(goal.priority)}>
                                  {goal.priority}
                                </span>
                              </h4>
                              <p className="text-secondary mb-1">
                                Deadline:{" "}
                                <span className="text-info fw-medium">
                                  {new Date(goal.deadline).toLocaleDateString()}
                                </span>{" "}
                                ({monthsLeft} month{monthsLeft !== 1 ? "s" : ""} left)
                              </p>
                              <p className="fw-medium mb-0">
                                ₹{goal.savedSoFar} / ₹{goal.targetAmount}
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div
                            className="progress mb-3"
                            style={{
                              height: "10px",
                              background: "#334155",
                              borderRadius: "10px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              className={`progress-bar ${
                                progress >= 100 ? "bg-success" : "bg-info"
                              }`}
                              role="progressbar"
                              style={{
                                width: `${progress}%`,
                                transition: "width 0.4s ease",
                              }}
                            ></div>
                          </div>

                          {/* Suggestion Box */}
                          <textarea
                            className="form-control bg-transparent border border-secondary text-light mb-3"
                            placeholder="💡 AI suggestion for your goal..."
                            rows="2"
                          ></textarea>

                          {/* Add + Delete */}
                          <div className="d-flex flex-column flex-md-row gap-2">
                            <input
                              type="number"
                              id={`add-${goal._id}`}
                              className="form-control bg-transparent border border-secondary text-light"
                              placeholder="Enter amount to add (₹)"
                            />
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-info text-dark fw-semibold px-3"
                                onClick={() => {
                                  const val = document.getElementById(
                                    `add-${goal._id}`
                                  ).value;
                                  handleAddSavings(goal._id, val);
                                }}
                              >
                                Add
                              </button>
                              <button
                                className="btn btn-outline-danger fw-semibold px-3"
                                onClick={() => handleDelete(goal._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- Floating Add Goal Button --- */}
      <Link
        to="/add-goal"
        className="btn btn-info position-fixed rounded-circle shadow-lg d-flex align-items-center justify-content-center"
        style={{
          width: "65px",
          height: "65px",
          bottom: "30px",
          right: "30px",
          background:
            "linear-gradient(135deg, rgba(14,165,233,1), rgba(56,189,248,1))",
          border: "none",
          boxShadow: "0 0 15px rgba(56,189,248,0.6)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow =
            "0 0 25px rgba(56,189,248,0.9)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow =
            "0 0 15px rgba(56,189,248,0.6)";
        }}
      >
        <PlusCircle size={32} color="white" />
      </Link>
    </div>
  );
}
