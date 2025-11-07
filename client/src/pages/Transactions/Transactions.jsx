import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8080/api/transactions/transaction-data",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTransactions(response.data);
      } catch (error) {
        console.error("Error fetching transactions", error);
        if (error.response?.status === 401) {
          alert("Session expired. Please login again.");
          localStorage.removeItem("token");
          navigate("/login");
        }
      }
    };

    if (!token) navigate("/login");
    else fetchData();
  }, [token, navigate]);

  const filteredTransactions = transactions
    .filter((tx) => filter === "ALL" || tx.type === filter)
    .filter(
      (tx) =>
        tx.category.toLowerCase().includes(search.toLowerCase()) ||
        tx.description.toLowerCase().includes(search.toLowerCase())
    );

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await axios.delete(`http://localhost:8080/api/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert("Failed to delete transaction");
    }
  };

  const handleUpdate = (id) => navigate(`/update-transaction/${id}`);

  return (
    <div
      className="min-vh-100 py-5 px-3"
      style={{
        background: "linear-gradient(to right, #0a192f, #112240, #0a192f)",
        color: "#f8f9fa",
      }}
    >
      <div className="container">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-light mb-3 mb-md-0">📊 Transactions</h2>
          <Link to="/add-transaction">
            <button className="btn btn-success px-4 py-2 fw-semibold shadow">
              + Add Transaction
            </button>
          </Link>
        </div>

        {/* Filters */}
        <div className="d-flex flex-wrap align-items-center mb-4 gap-2">
          {["ALL", "Income", "Expense"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${
                filter === f ? "btn-primary" : "btn-outline-light"
              } fw-semibold`}
            >
              {f}
            </button>
          ))}

          <input
            type="text"
            className="form-control ms-auto text-light"
            placeholder="🔍 Search by category or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              maxWidth: "350px",
              backgroundColor: "#1b2a4a",
              border: "1px solid #3a506b",
              color: "white",
            }}
          />
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle shadow rounded-3 overflow-hidden">
            <thead style={{ backgroundColor: "#1e3a5f" }}>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Payment</th>
                <th>Amount (₹)</th>
                <th>Type</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx._id}
                    style={{ backgroundColor: "#14213d", color: "#f1f1f1" }}
                  >
                    <td>{new Date(tx.date).toLocaleDateString()}</td>
                    <td>{tx.category}</td>
                    <td>{tx.paymentMethod}</td>
                    <td
                      className={
                        tx.type === "Expense" ? "text-danger" : "text-success"
                      }
                    >
                      ₹{tx.amount}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          tx.type === "Income" ? "bg-success" : "bg-danger"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => handleUpdate(tx._id)}
                        className="btn btn-sm btn-outline-info me-2"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tx._id)}
                        className="btn btn-sm btn-outline-danger"
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-secondary">
                    No transactions found 😔
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Cards */}
        {transactions.length > 0 && (
          <div className="row mt-5 text-center g-4">
            <div className="col-md-4">
              <div
                className="card text-white shadow border-0 p-3"
                style={{ backgroundColor: "#198754" }}
              >
                <h5>Total Income</h5>
                <h4 className="fw-bold">
                  ₹
                  {transactions
                    .filter((t) => t.type === "Income")
                    .reduce((sum, t) => sum + t.amount, 0)}
                </h4>
              </div>
            </div>
            <div className="col-md-4">
              <div
                className="card text-white shadow border-0 p-3"
                style={{ backgroundColor: "#dc3545" }}
              >
                <h5>Total Expense</h5>
                <h4 className="fw-bold">
                  ₹
                  {transactions
                    .filter((t) => t.type === "Expense")
                    .reduce((sum, t) => sum + t.amount, 0)}
                </h4>
              </div>
            </div>
            <div className="col-md-4">
              <div
                className="card text-dark shadow border-0 p-3"
                style={{ backgroundColor: "#ffc107" }}
              >
                <h5>Net Savings</h5>
                <h4 className="fw-bold">
                  ₹
                  {transactions
                    .reduce(
                      (sum, t) =>
                        t.type === "Income" ? sum + t.amount : sum - t.amount,
                      0
                    )
                    .toFixed(2)}
                </h4>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
