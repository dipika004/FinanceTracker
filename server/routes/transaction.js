const express = require("express");
const Transaction = require("../models/Transactions");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

// ==========================
// Create a new transaction
// ==========================
// router.post("/add", verifyToken, async (req, res) => {
//   try {
//     const { type, amount, category, date, paymentMethod, description } = req.body;

//     const newTransaction = new Transaction({
//       userId: req.userId,
//       type,
//       amount,
//       category,
//       date,
//       paymentMethod,
//       description,
//     });

//     await newTransaction.save();
//     res.status(201).json({ message: "Transaction added successfully", transaction: newTransaction });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server Error" });
//   }
// });

router.post("/add", verifyToken, async (req, res) => {
  try {
    let { type, amount, category, date, paymentMethod, description } = req.body;

    // Fallbacks for missing fields
    type = type || "Expense"; // default to Expense if missing
    amount = amount || 0;
    category = category || "Other";
    date = date ? new Date(date) : new Date(); // today if missing
    paymentMethod = paymentMethod || "Others";
    description = description || "Auto-added from receipt";

    const newTransaction = new Transaction({
      userId: req.userId,
      type,
      amount,
      category,
      date,
      paymentMethod,
      description,
    });

    await newTransaction.save();
    res.status(201).json({ message: "Transaction added successfully", transaction: newTransaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});


// ==========================
// Get all transactions for user
// ==========================
router.get("/transaction-data", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const transactions = await Transaction.find({ userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================
// Get all unique categories for user
// Must be before /:id route!
// ==========================
router.get("/categories", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const categories = await Transaction.distinct("category", { userId });
    res.json({ categories });
  } catch (err) {
    console.error("Error fetching categories", err);
    res.status(500).json({ message: "Server error fetching categories" });
  }
});

// ==========================
// Get a single transaction by ID
// ==========================
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Ensure user can only access their own transactions
    if (transaction.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(transaction);
  } catch (err) {
    console.error("Error fetching transaction:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================
// Update a transaction by ID
// ==========================
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updatedTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(updatedTransaction);
  } catch (err) {
    console.error("Failed to update Transaction:", err);
    res.status(400).json({ message: "Error updating transaction" });
  }
});

// ==========================
// Delete a transaction by ID
// ==========================
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);

    if (!deletedTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    console.error("Error deleting Transaction:", err);
    res.status(500).json({ message: "Error deleting transaction" });
  }
});

module.exports = router;
