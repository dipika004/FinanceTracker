const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { exec } = require("child_process");
require('dotenv').config();

const port = process.env.PORT || 8080;  // Render assigns port dynamically
const app = express();
const jwt = require('jsonwebtoken');

// ----------------------------
// Import routes
// ----------------------------
const authRoutes = require('./routes/authRoutes');
const transaction = require("./routes/transaction");
const goalRoutes = require("./routes/goalRoutes");
const aiRoutes = require("./routes/aiRoutes");
const geminiRoutes = require("./routes/gemini");
const chatRoutes = require("./routes/chatRoutes");

// ----------------------------
// CORS configuration
// ----------------------------
// Allow local dev + deployed frontend URL
const allowedOrigins = [
    "http://localhost:5173",                       // Local frontend
    "https://financetracker-ra2k.onrender.com"    // Deployed frontend URL
];

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true   // Required if frontend sends cookies/JWT
}));

// ----------------------------
// Middleware
// ----------------------------
app.use(express.json());

// ----------------------------
// Routes
// ----------------------------
app.use('/api/auth', authRoutes);
app.use("/api/transactions", transaction);
app.use("/api/goals", goalRoutes);
app.use("/api", aiRoutes);
app.use("/api/gemini", geminiRoutes);
app.use("/api/chat", chatRoutes);

// ----------------------------
// Auto-run Python AI every 24 hours
// ----------------------------
setInterval(() => {
    console.log("🧠 Running AI model daily...");
    exec("python ./ai_service/main.py", (err, stdout, stderr) => {
        if (err) return console.error("AI run error:", err);
        console.log(stdout);
    });
}, 24 * 60 * 60 * 1000); // every 24 hours

// ----------------------------
// Connect to MongoDB
// ----------------------------
const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.log("❌ Error connecting to MongoDB:", err));

// ----------------------------
// Start server
// ----------------------------
app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
});
