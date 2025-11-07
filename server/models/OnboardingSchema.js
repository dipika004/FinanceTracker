const mongoose = require("mongoose");

const onboardingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SignUp",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  age: {
    type: String,
    enum: ["18-25", "26-35", "36-45", "46-60", "60+"],
    required: true,
  },
  incomeRange: {
    type: String,
    enum: ["0-3 LPA", "3-6 LPA", "6-10 LPA", "10-15 LPA", "15+ LPA"],
    required: true,
  },
  monthlyIncome: {
    type: Number,
    required: true,
    default: 0,
  },
  monthlyExpenses: {
    type: Number,
    required: true,
    default: 0,
  },
  savings: {
    type: Number,
    required: true,
    default: 0,
  },
  mainExpenses: {
    type: [String],
    enum: ["Food", "Transport", "Bills", "Shopping", "Entertainment", "Others"],
    required: true,
  },
  financialExperience: {
    type: String,
    enum: ["Beginner", "Intermediate", "Expert"],
    required: true,
  },
  shortTermGoals: {
    type: String,
  },
  longTermGoals: {
    type: String,
  },
  currency: {
    type: String,
    enum: ["INR", "USD", "EUR", "GBP", "JPY"],
  },
  notifications: {
    type: [String],
    enum: ["Email", "SMS", "Push"],
    default: [],
  },
});

const OnboardingSchema = mongoose.model("OnboardingSchema", onboardingSchema);
module.exports = OnboardingSchema;
