// data.js
require("dotenv").config(); // load .env variables
const mongoose = require("mongoose");
const Transaction = require("../models/Transactions"); // adjust path to your Transaction model

// Use MongoDB URL from .env
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error("❌ MONGO_URL not found in .env");
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    console.log("✅ Connected to MongoDB");

    const dummyTransactions = [];
    const categories = ["Food","Shopping","Rent","Salary","Bills","Freelance","Transport","Entertainment","Investment","Groceries"];
    const paymentMethods = ["Cash","Credit Card","Debit Card","UPI","Net Banking","Others"];
    const userId = "68f29a6b39f4750c9a22e1fd"; // replace with your actual user _id

    for(let i=0;i<100;i++){
      const isIncome = Math.random() > 0.6;
      const category = isIncome ? (Math.random()>0.5?"Salary":"Freelance") : categories[Math.floor(Math.random()*categories.length)];
      const amount = isIncome ? Math.floor(Math.random()*20000)+5000 : Math.floor(Math.random()*2000)+100;
      const paymentMethod = paymentMethods[Math.floor(Math.random()*paymentMethods.length)];
      const description = isIncome ? `Received from ${category}` : `Spent on ${category}`;
      const date = new Date(Date.now() - Math.random()*31536000000); // random date last year

      dummyTransactions.push({
        userId,
        type: isIncome ? "Income" : "Expense",
        amount,
        category,
        date,
        paymentMethod,
        description
      });
    }

    await Transaction.insertMany(dummyTransactions);
    console.log("✅ 100 Dummy transactions inserted successfully!");

    // Verify inserted
    const count = await Transaction.countDocuments();
    console.log("Total documents now:", count);

  } catch(err){
    console.error("❌ Error:", err);
  } finally{
    await mongoose.connection.close();
    console.log("🔒 Connection closed");
  }
}

run();
