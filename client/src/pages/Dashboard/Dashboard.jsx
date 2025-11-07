import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css";

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [savings, setSavings] = useState(0);
  const [goals, setGoals] = useState([]);
  const [aiSummary, setAiSummary] = useState([]);
  const [aiLoading, setAiLoading] = useState(true);

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const name = localStorage.getItem("name") || "User";
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const COLORS = ["#4FC3F7", "#81C784", "#FFD54F", "#E57373", "#BA68C8", "#64B5F6"];

  // -----------------------------
  // Fetch Transactions & Chart Data
  // -----------------------------
  useEffect(() => {
    if (!token) {
      alert("Login timed out");
      navigate("/login");
      return;
    }

    const fetchTransactions = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8080/api/transactions/transaction-data",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let transactions = response.data || [];

        const onboardIncome = Number(localStorage.getItem("monthlyIncome") || 0);
        const onboardExpense = Number(localStorage.getItem("monthlyExpenses") || 0);

        // Totals including onboarding
        const totalIncome =
          transactions.filter((t) => t.type === "Income").reduce((sum, t) => sum + t.amount, 0) ||
          onboardIncome;
        const totalExpense =
          transactions.filter((t) => t.type === "Expense").reduce((sum, t) => sum + t.amount, 0) ||
          onboardExpense;
        setIncome(totalIncome);
        setExpense(totalExpense);
        setSavings(Math.max(totalIncome - totalExpense, 0));

        // Filter out onboarding for chart data
        const manualTransactions = transactions.filter((t) => t.category !== "Onboarding");

        // Category-wise expenses
        const categoryMap = {};
        manualTransactions
          .filter((t) => t.type === "Expense")
          .forEach((t) => {
            categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
          });
        setCategoryData(Object.entries(categoryMap).map(([name, value]) => ({ name, value })));

        // Monthly overview for bar & line chart
        const monthly = {};
        manualTransactions.forEach((t) => {
          const month = new Date(t.date).toLocaleString("default", { month: "short" });
          if (!monthly[month]) monthly[month] = { name: month, income: 0, expense: 0, savings: 0 };
          if (t.type === "Income") monthly[month].income += t.amount;
          else monthly[month].expense += t.amount;
          monthly[month].savings = Math.max(monthly[month].income - monthly[month].expense, 0);
        });
        setData(Object.values(monthly));
      } catch (err) {
        console.error("Error fetching dashboard data", err);
        if (err.response?.status === 401) {
          localStorage.clear();
          navigate("/login");
        }
      }
    };

    fetchTransactions();
  }, [token, navigate]);

  // -----------------------------
  // Fetch Goals & Images
  // -----------------------------
  useEffect(() => {
    if (!token) return;

    const fetchGoals = async () => {
      try {
        const goalResponse = await axios.get("http://localhost:8080/api/goals", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const goalsData = goalResponse.data || [];
        const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

        const goalsWithImages = await Promise.all(
          goalsData.map(async (goal) => {
            try {
              const res = await axios.get("https://api.unsplash.com/search/photos", {
                params: { query: goal.goalName, per_page: 1 },
                headers: { Authorization: `Client-ID ${accessKey}` },
              });
              const imageUrl = res.data.results?.[0]?.urls?.regular || "/images/default.png";
              return { ...goal, imageUrl };
            } catch {
              return { ...goal, imageUrl: "/images/default.png" };
            }
          })
        );

        setGoals(goalsWithImages);
      } catch (err) {
        console.error("Error fetching goals", err);
      }
    };

    fetchGoals();
  }, [token]);

  // -----------------------------
  // Fetch AI Summary
  // -----------------------------
  useEffect(() => {
    if (!userId) return;

    const fetchAISummary = async () => {
      setAiLoading(true);
      try {
        const res = await axios.post("http://localhost:5002/summary", { userId });
        const summaryText = res.data.summary || "";
        const summaryPoints = summaryText
          .split(/[•\n\-]+/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
        setAiSummary(summaryPoints);
      } catch {
        setAiSummary(["AI summary not available. Please try again later."]);
      } finally {
        setAiLoading(false);
      }
    };

    fetchAISummary();
  }, [userId]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #001F3F, #0A192F, #112240)",
        color: "white",
        padding: "30px 15px",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* Greeting */}
      <div className="text-center mb-5 animate__animated animate__fadeInDown">
        <h2 className="fw-bold text-info mb-2">{greeting}, {name}! 👋</h2>
        <p className="text-light fs-5">Your smart financial insights are ready.</p>
      </div>

      {/* Quick Stats */}
      <div className="container mb-5">
        <div className="row g-4 justify-content-center">
          {[{ title: "Income", value: `₹${income}`, color: "#4FC3F7" },
            { title: "Expenses", value: `₹${expense}`, color: "#FF5252" },
            { title: "Savings", value: income - expense < 0 ? "⚠️ Overspending" : `₹${savings}`, color: "#FFD740" }
          ].map((item, i) => (
            <div key={i} className="col-md-3 col-sm-6 animate__animated animate__zoomIn">
              <div
                className="card text-center p-4 border-0 shadow-sm"
                style={{
                  background: "#162447",
                  color: "white",
                  borderRadius: "20px",
                  boxShadow: "0px 0px 15px rgba(79,195,247,0.15)",
                  transition: "0.3s",
                }}
              >
                <h5 style={{ color: item.color }}>{item.title}</h5>
                <h3 className="fw-bold">{item.value}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="container mb-5">
        <div className="row g-5 justify-content-center">
          {/* Pie Chart */}
          <div className="col-lg-5 col-md-10 animate__animated animate__fadeInLeft">
            <h4 className="fw-semibold text-center mb-3 text-info">💰 Expenses by Category</h4>
            <div className="card border-0 p-3" style={{ background: "#0F2547", borderRadius: "20px", height: "420px" }}>
              <ResponsiveContainer width="100%" height="100%">
                {categoryData.length > 0 ? (
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" outerRadius={120} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                      {categoryData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1E2A47", color: "white" }} />
                  </PieChart>
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "18px" }}>
                    No data yet
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="col-lg-7 col-md-10 animate__animated animate__fadeInRight">
            <h4 className="fw-semibold text-center mb-3 text-info">📅 Monthly Overview</h4>
            <div className="card border-0 p-3" style={{ background: "#0F2547", borderRadius: "20px", height: "420px" }}>
              <ResponsiveContainer width="100%" height="100%">
                {data.length > 0 ? (
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2E3B55" />
                    <XAxis dataKey="name" stroke="#E0E0E0" />
                    <YAxis stroke="#E0E0E0" />
                    <Tooltip contentStyle={{ background: "#1E2A47", color: "white" }} />
                    <Legend />
                    <Bar dataKey="income" fill="#4FC3F7" />
                    <Bar dataKey="expense" fill="#FF5252" />
                    <Bar dataKey="savings" fill="#FFD740" />
                  </BarChart>
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "18px" }}>
                    No data yet
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="col-12 mt-5 animate__animated animate__fadeInUp">
          <h4 className="fw-semibold text-center mb-3 text-info">📈 Income vs Expense vs Savings</h4>
          <div className="card border-0 p-3" style={{ background: "#0F2547", borderRadius: "20px" }}>
            <ResponsiveContainer width="100%" height={350}>
              {data.length > 0 ? (
                <LineChart data={data}>
                  <CartesianGrid stroke="#2E3B55" strokeDasharray="5 5" />
                  <XAxis dataKey="name" stroke="#E0E0E0" />
                  <YAxis stroke="#E0E0E0" />
                  <Tooltip contentStyle={{ background: "#1E2A47", color: "white" }} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#4FC3F7" />
                  <Line type="monotone" dataKey="expense" stroke="#FF5252" />
                  <Line type="monotone" dataKey="savings" stroke="#FFD740" />
                </LineChart>
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "18px" }}>
                  No data yet
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Goals Section */}
      <div className="container my-5 animate__animated animate__fadeInUp">
        <h3 className="text-center mb-4 text-info fw-bold">🎯 My Goals</h3>
        <div className="row justify-content-center g-4">
          {goals.map((goal, idx) => {
            const completion = Math.min(100, Math.round((goal.savedSoFar / goal.targetAmount) * 100));
            return (
              <div key={idx} className="col-md-3 col-sm-6">
                <div className="card border-0 text-center shadow-sm" style={{ background: "#162447", borderRadius: "20px", color: "white" }}>
                  <img src={goal.imageUrl} alt={goal.goalName} className="w-100" style={{ height: "160px", objectFit: "cover", borderRadius: "20px 20px 0 0" }} />
                  <div className="p-3">
                    <h5 className="fw-bold">{goal.goalName}</h5>
                    <div className="progress my-2" style={{ height: "10px" }}>
                      <div className={`progress-bar ${completion === 100 ? "bg-success" : "bg-info"}`} style={{ width: `${completion}%` }}></div>
                    </div>
                    <span className="fw-semibold text-light">{completion}% Completed</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Summary */}
      <div className="container mb-5 animate__animated animate__fadeIn">
        <div className="card border-0 p-4" style={{ background: "#162447", borderRadius: "20px", color: "white" }}>
          <h3 className="text-center mb-3 text-info fw-bold">🤖 AI Summary & Insights</h3>
          {aiLoading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100px" }}>
              <div className="spinner-border text-info" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="ms-2">AI is analyzing your transactions...</span>
            </div>
          ) : aiSummary.length > 0 ? (
            <ul className="list-unstyled fs-6">
              {aiSummary.map((point, i) => (
                <li key={i} className="mb-2">• {point}</li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted">AI summary not available. Please try again later.</p>
          )}
        </div>
      </div>
    </div>
  );
}
