// routes/aiRouter.js
const express = require("express");
const { exec } = require("child_process");
const mongoose = require("mongoose");

const router = express.Router();

// ✅ Get AI Summary for a specific user
// aiRouter.js
router.get("/ai-summary/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const Summary = mongoose.connection.collection("ai_summaries");

    let query;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      query = { userId: new mongoose.Types.ObjectId(userId) };
    } else {
      query = { userId };
    }

    const summaryData = await Summary.findOne(query);
    if (!summaryData) return res.status(404).json({ message: "No summary found" });

    // Generate a text summary
    const summaryText = [
      `• Your total income is ₹${summaryData.income.toLocaleString()}.`,
      `• Your total expenses are ₹${summaryData.expense.toLocaleString()}.`,
      `• Your current savings are ₹${summaryData.savings.toLocaleString()}.`,
      `• Your goal progress is ${summaryData.goal_progress.toFixed(2)}%.`,
      `• Forecasted expenses next month: ₹${summaryData.expense_forecast_next_month.toLocaleString()}.`,
      `• Top expense categories: ${Object.entries(summaryData.category_summary)
        .sort(([,a],[,b]) => b - a)
        .slice(0, 3)
        .map(([cat, val]) => `${cat} ₹${val.toLocaleString()}`)
        .join(", ")}.`
    ].join("\n");

    res.json({ summary: summaryText });

  } catch (err) {
    console.error("❌ Error fetching summary:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ✅ Trigger Python AI model manually (optional)
router.get("/run-ai", (req, res) => {
  exec("python ./ai_service/main.py", (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Error running AI script:", err);
      return res.status(500).json({ message: "AI process failed" });
    }
    console.log("🤖 Python AI output:", stdout);
    res.json({ message: "AI script executed successfully" });
  });
});

module.exports = router;
