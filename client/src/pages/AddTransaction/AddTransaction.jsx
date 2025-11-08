import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const AddTransaction = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currency = localStorage.getItem("currency") || "₹";
  const { id } = useParams();

  const [formData, setFormData] = useState({
    type: "",
    amount: "",
    category: "",
    date: "",
    paymentMethod: "",
    description: "",
  });

  const [userCategories, setUserCategories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [receiptMode, setReceiptMode] = useState(false); // NEW: flag for receipt mode

  // Fetch user categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8080/api/transactions/categories",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUserCategories(res.data.categories || []);
      } catch (err) {
        console.error(err);
      }
    };
    if (token) fetchCategories();
  }, [token]);

  // Fetch transaction if updating
  useEffect(() => {
    if (!id) return;
    const fetchTransaction = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/transactions/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFormData(res.data);
      } catch (err) {
        console.error(err);
        alert("Failed to load transaction for update");
        navigate("/transactions");
      }
    };
    fetchTransaction();
  }, [id, token, navigate]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "category") {
      const filtered = userCategories.filter((c) =>
        c.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    }
  };

  // Normalize category
  const normalizeCategory = (category) =>
    category.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.type || !formData.amount || !formData.category) {
      alert("Please fill all required fields");
      return;
    }

    const dataToSend = { ...formData, category: normalizeCategory(formData.category) };
    setLoading(true);

    try {
      if (id) {
        await axios.put(`http://localhost:8080/api/transactions/${id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Transaction updated successfully");
      } else {
        await axios.post("http://localhost:8080/api/transactions/add", dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Transaction added successfully");
      }

      if (!userCategories.includes(dataToSend.category)) {
        setUserCategories([...userCategories, dataToSend.category]);
      }

      navigate("/transactions");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle receipt upload and ML parsing
const handleReceiptUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setUploading(true);

  const form = new FormData();
  form.append("receipt", file);

  try {
    const res = await axios.post(
      "http://localhost:5002/parse-receipt",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    const parsed = res.data;

    // Fill missing fields with safe defaults
    setFormData((prev) => ({
      ...prev,
      type: prev.type || parsed.type || "Expense",
      amount: parsed.amount || 0,
      category: parsed.category || "Other",
      date: parsed.date || new Date().toISOString().split("T")[0],
      paymentMethod: parsed.paymentMethod || "Others",
      description: parsed.description || "Auto-added from receipt",
    }));

    setReceiptMode(true); // switch to auto-filled mode
  } catch (err) {
    console.error(err);
    alert("Failed to parse receipt. Try again.");
  } finally {
    setUploading(false);
  }
};


  return (
    <div className="container py-5" style={{ minHeight: "100vh" }}>
      <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: "550px" }}>
        <h2 className="text-center mb-4 text-primary">
          {id ? "Update Transaction" : "Add New Transaction"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Type Buttons */}
          <div className="d-flex mb-3 gap-2">
            {["Income", "Expense"].map((t) => (
              <button
                key={t}
                type="button"
                className={`btn flex-fill ${
                  formData.type === t ? (t === "Income" ? "btn-success" : "btn-danger") : "btn-secondary"
                }`}
                onClick={() => setFormData({ ...formData, type: t })}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Receipt Upload */}
          {!receiptMode && (
            <div className="mb-3">
              <label className="form-label">Upload Receipt</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleReceiptUpload}
                className="form-control"
              />
              {uploading && <small className="text-muted">Processing receipt...</small>}
            </div>
          )}

          {/* Manual Input Fields (only if not receiptMode or for manual editing) */}
          <div style={{ display: receiptMode ? "none" : "block" }}>
            {/* Amount */}
            <div className="mb-3">
              <label className="form-label">Amount ({currency})</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            {/* Category */}
            <div className="mb-3">
              <label className="form-label">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                list="category-suggestions"
                placeholder="Enter or choose a category"
                className="form-control"
                required
              />
              <datalist id="category-suggestions">
                {suggestions.map((c, idx) => (
                  <option key={idx} value={c} />
                ))}
              </datalist>
            </div>

            {/* Date */}
            <div className="mb-3">
              <label className="form-label">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            {/* Payment Method */}
            <div className="mb-3">
              <label className="form-label">Payment Method</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select Payment Method</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="UPI">UPI</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Others">Others</option>
              </select>
            </div>

            {/* Description */}
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-control"
                placeholder="Add notes about this transaction..."
                rows="3"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Saving..." : id ? "Update Transaction" : "Add Transaction"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransaction;
