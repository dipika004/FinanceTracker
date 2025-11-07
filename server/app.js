const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');
const port=8080;
const app=express();
const jwt=require('jsonwebtoken');
require('dotenv').config();
const authRoutes=require('./routes/authRoutes');
const transaction=require("./routes/transaction");
const goalRoutes=require("./routes/goalRoutes");
const aiRoutes=require("./routes/aiRoutes");
const geminiRoutes=require("./routes/gemini");
const chatRoutes=require("./routes/chatRoutes");

app.use(cors());
app.use(express.json());

app.use('/api/auth',authRoutes);
app.use("/api/transactions", transaction);
app.use("/api/goals", goalRoutes);
app.use("/api", aiRoutes);
app.use("/api/gemini", geminiRoutes);
app.use("/api/chat", chatRoutes);

//Auto-run Python AI every 24 hours
const { exec } = require("child_process");
setInterval(() => {
  console.log("🧠 Running AI model daily...");
  exec("python ./ai_service/main.py", (err, stdout, stderr) => {
    if (err) return console.error("AI run error:", err);
    console.log(stdout);
  });
}, 24 * 60 * 60 * 1000); // every 24 hours

const MONGO_URL=process.env.MONGO_URL;
mongoose.connect(MONGO_URL)
.then(()=>{
    console.log("Connected to MongoDB");
}).catch((err)=>{
    console.log("Error connecting to MongoDB:",err);
});


app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});