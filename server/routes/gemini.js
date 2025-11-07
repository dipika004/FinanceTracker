require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const Goal = require("../models/Goal");
const Transaction = require("../models/Transactions");
const User = require("../models/SignUp");

// 🔹 Helper to extract userId safely
function extractUserId(req) {
  if (req.user && (req.user._id || req.user.id)) {
    return req.user._id || req.user.id;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || decoded.userId || decoded._id;
  } catch (err) {
    console.warn("JWT verify failed:", err.message);
    return null;
  }
}

// 🔹 Local AI-style summary generator
function buildLocalSummary(user, goals, monthlyTransactions, categoryTotals, query) {
  const lines = [];

  lines.push(`Hi ${user?.name || "there"} 👋 Here’s a personalized finance summary:`);

  const totalIncome = monthlyTransactions
    .filter((t) => String(t.type).toLowerCase() === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = monthlyTransactions
    .filter((t) => String(t.type).toLowerCase() === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netSavings = totalIncome - totalExpense;

  lines.push(`💰 Income: ₹${totalIncome.toFixed(2)} | 💸 Expenses: ₹${totalExpense.toFixed(2)} | 💹 Net: ₹${netSavings.toFixed(2)}`);

  // Top categories
  const topCats = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topCats.length > 0) {
    lines.push("📂 Top spending categories:");
    topCats.forEach(([cat, amt]) => lines.push(`- ${cat}: ₹${amt.toFixed(2)}`));
  } else {
    lines.push("📂 No expense categories recorded this month.");
  }

  // Goals
  if (goals.length > 0) {
    lines.push("🎯 Active goals:");
    goals.forEach((g) => {
      const saved = Number(g.savedAmount || 0);
      const target = Number(g.targetAmount || 0);
      const progress = target ? ((saved / target) * 100).toFixed(1) : 0;
      lines.push(`- ${g.title || "Untitled Goal"}: ₹${saved}/${target} (${progress}%)`);
    });
  } else {
    lines.push("🎯 You have no active goals yet.");
  }

  // Smart advice
  if (netSavings < 0) {
    lines.push("⚠️ You're spending more than you earn this month. Try reducing your top expense category.");
  } else if (netSavings < totalIncome * 0.2) {
    lines.push("✅ Try to increase savings to at least 20% of income.");
  } else {
    lines.push("🎉 Great job! You're saving well this month.");
  }

  // Answer specific questions simply
  if (query && query.trim().length) {
    lines.push("\n💬 Regarding your question:");
    const q = query.toLowerCase();
    if (q.includes("save")) {
      lines.push("- Automate transfers to savings each month.");
      lines.push("- Cut small daily costs like snacks or online orders.");
    } else if (q.includes("spend")) {
      lines.push("- Review your top expense categories and limit non-essential purchases.");
    } else if (q.includes("goal")) {
      lines.push("- Prioritize goals by deadlines and start with the one closest to completion.");
    } else {
      lines.push("- Focus on keeping expenses under control while maintaining consistent savings.");
    }
  }

  lines.push("\nWould you like a full category breakdown or savings suggestion?");

  return lines.join("\n");
}

// 🔹 POST /api/gemini
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = extractUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized: Invalid token" });

    const { query } = req.body || {};
    if (!query || !query.trim()) return res.status(400).json({ message: "Query is required" });

    // Fetch user's data
    const [user, goals, transactions] = await Promise.all([
      User.findById(userId).lean(),
      Goal.find({ userId }).lean(),
      Transaction.find({ userId }).lean(),
    ]);

    // Filter transactions for this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const monthlyTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= startOfMonth && date <= endOfMonth;
    });

    // Calculate category totals
    const categoryTotals = {};
    monthlyTransactions.forEach((t) => {
      if (t.type.toLowerCase() === "expense") {
        const cat = t.category || "Other";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount || 0);
      }
    });

    // Generate summary
    const reply = buildLocalSummary(user, goals, monthlyTransactions, categoryTotals, query);

    res.json({ reply });
  } catch (error) {
    console.error("Gemini route error:", error);
    res.status(500).json({ message: "Internal server error. Check server logs." });
  }
});

module.exports = router;
