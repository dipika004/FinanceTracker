const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SignUp = require("../models/SignUp");
const Onboarding = require("../models/OnboardingSchema");
const Transaction = require("../models/Transactions");
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config();
const verifyToken = require("../middleware/verifyToken");

// =====================
// Sign Up Route
// =====================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    const existingUser = await SignUp.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new SignUp({
      name,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// =====================
// Onboarding Route
// =====================
router.post("/onboarding", verifyToken, async (req, res) => {
  try {
    const existingOnboarding = await Onboarding.findOne({ userId: req.userId });
    if (existingOnboarding) {
      return res
        .status(400)
        .json({ message: "Onboarding data already exists for this user" });
    }

    const newOnboarding = new Onboarding({
      userId: req.userId,
      ...req.body,
    });
    await newOnboarding.save();

    const onboardingTransactions = [
      {
        userId: req.userId,
        type: "Income",
        amount: Number(req.body.monthlyIncome) || 0,
        category: "Onboarding",
        paymentMethod: "Others",
      },
      {
        userId: req.userId,
        type: "Expense",
        amount: Number(req.body.monthlyExpenses) || 0,
        category: "Onboarding",
        paymentMethod: "Others",
      },
    ];
    await Transaction.insertMany(onboardingTransactions);

    res.status(201).json({
      message: "Onboarding data saved successfully",
      data: newOnboarding,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// =====================
// Login Route
// =====================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await SignUp.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Login Successfully",
      token,
      user: { name: user.name, email: user.email },
      id: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// =====================
// Fetch current user info
// =====================
router.get("/user", verifyToken, async (req, res) => {
  try {
    const user = await SignUp.findById(req.userId).select("name email");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// =====================
// Fetch onboarding info
// =====================
router.get("/onboarding", verifyToken, async (req, res) => {
  try {
    const onboarding = await Onboarding.findOne({ userId: req.userId }).select("-_id -userId -mainExpenses");
    if (!onboarding) return res.status(404).json({ message: "Onboarding info not found" });

    res.status(200).json(onboarding);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// =====================
// Update user info (password)
// =====================
router.put("/user", verifyToken, async (req, res) => {
  try {
    const { password } = req.body;
    const updatedData = {};

    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    await SignUp.findByIdAndUpdate(req.userId, updatedData);
    res.status(200).json({ message: "User info updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// =====================
// Update onboarding info
// =====================
router.put("/onboarding", verifyToken, async (req, res) => {
  try {
    const dataToUpdate = { ...req.body };

    // Remove unwanted fields
    delete dataToUpdate._id;
    delete dataToUpdate.userId;
    delete dataToUpdate.mainExpenses;

    await Onboarding.findOneAndUpdate({ userId: req.userId }, dataToUpdate, { new: true });
    res.status(200).json({ message: "Onboarding info updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
