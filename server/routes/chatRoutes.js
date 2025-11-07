require("dotenv").config();
const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const verifyToken = require("../middleware/verifyToken");
const User = require("../models/SignUp");
const Goal = require("../models/Goal");
const Transaction = require("../models/Transactions");
const Chat = require("../models/Chat");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

/* ---------------- Helper Functions ---------------- */

// AI generator
async function generateGeminiReply(prompt) {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text() || "Sorry, I couldn’t generate a response.";
  } catch (err) {
    console.error("Gemini API Error:", err.message);
    return "There was an issue connecting to AI. Please try again later.";
  }
}

// Build dynamic AI prompt with finance data
function buildDataDrivenPrompt(user, goals, transactions, query) {
  const now = new Date();

  const getMonthRange = (year, month) => ({
    start: new Date(year, month, 1, 0, 0, 0, 0),
    end: new Date(year, month + 1, 0, 23, 59, 59, 999),
  });

  const { start: startThis, end: endThis } = getMonthRange(now.getFullYear(), now.getMonth());
  let monthlyTxns = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= startThis && d <= endThis;
  });

  let summaryMonth = "this month";

  // If no data → fallback to last month
  if (monthlyTxns.length === 0) {
    const lastMonth = now.getMonth() - 1;
    const { start: startLast, end: endLast } = getMonthRange(now.getFullYear(), lastMonth);
    monthlyTxns = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= startLast && d <= endLast;
    });
    summaryMonth =
      monthlyTxns.length > 0
        ? "last month (no data found for this month)"
        : "recent months (no data available)";
  }

  const totalIncome = monthlyTxns
    .filter((t) => t.type?.toLowerCase() === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = monthlyTxns
    .filter((t) => t.type?.toLowerCase() === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const categoryTotals = {};
  monthlyTxns.forEach((t) => {
    if (t.type?.toLowerCase() === "expense") {
      const cat = t.category?.trim() || "Other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount || 0);
    }
  });

  let prompt = `Hi ${user.name || "there"} 👋\n\nHere’s your ${summaryMonth} financial overview:\n\n`;
  prompt += `💰 **Income:** ₹${totalIncome}\n`;
  prompt += `💸 **Expenses:** ₹${totalExpense}\n`;

  if (Object.keys(categoryTotals).length > 0) {
    prompt += `\n📂 **Spending Breakdown:**\n`;
    for (const [cat, amt] of Object.entries(categoryTotals)) {
      prompt += `• ${cat}: ₹${amt}\n`;
    }
  } else {
    prompt += `\n📂 No spending data found for ${summaryMonth}.\n`;
  }

  if (goals.length > 0) {
    prompt += `\n🎯 **Active Goals:**\n`;
    goals.forEach((g) => {
      const saved = Number(g.savedSoFar || 0);
      const target = Number(g.targetAmount || 0);
      const progress = target ? ((saved / target) * 100).toFixed(1) : 0;
      prompt += `• ${g.goalName || "Untitled"} — ₹${saved}/₹${target} (${progress}%)\n`;
    });
  } else {
    prompt += `\n🎯 You have no active goals yet.\n`;
  }

  prompt += `\n💬 User Question:\n"${query}"\n\n`;
  // prompt += `Please answer this naturally like a personal finance assistant — explain how the user can improve or achieve their goal based on this data. Avoid repeating the same numbers; focus on insights and clear advice.\n`;
  prompt += `Give a short and friendly 2–4 line response like a smart personal finance coach. 
            Be concise, realistic, and speak directly. 
            If it's about a big goal (like house or bike), give one quick insight or step, not a full analysis.\n`;
  return prompt;
}

/* ---------------- Routes ---------------- */

// 💬 Direct AI Chat
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { query } = req.body;
    if (!query || !query.trim()) return res.status(400).json({ message: "Query is required" });

    const [user, goals, transactions] = await Promise.all([
      User.findById(userId).lean(),
      Goal.find({ userId }).lean(),
      Transaction.find({ userId }).lean(),
    ]);

    const casualPatterns = /^(hi|hello|hey|hlo|how are you|who are you|ok|thanks|thank you)$/i;
    const financeScope = /(spend|expense|income|goal|saving|budget|money|finance|amount|balance|house|car|buy|plan|achieve|target|worth|invest|investment|save|loan|dream|property|debt|rent|bill|wallet|tiffin|restaurant|startup|profit|loss)/i;

    let aiReply;

    if (casualPatterns.test(query.trim())) {
      aiReply = "Hey there! 👋 I’m Lakshmi Loop, your personal AI finance assistant. How can I help you today?";
    } else if (!financeScope.test(query)) {
      aiReply = "Hi! 😊 I specialize in finance, goals, and savings. Try asking something like 'How much did I spend this month?' or 'How can I reach my dream goal faster?'";
    } else {
      const finalPrompt = buildDataDrivenPrompt(user, goals, transactions, query);
      aiReply = await generateGeminiReply(finalPrompt);
    }

    res.json({ reply: aiReply });
  } catch (err) {
    console.error("Chat AI error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.post("/message", verifyToken, async (req, res) => {
  try {
    const { chatId, message } = req.body;
    const userId = req.userId;

    // Save message
    const newMessage = await Message.create({ chatId, sender: userId, content: message });

    // If chat title not set, update it with first few words of the message
    const chat = await Chat.findById(chatId);
    if (chat && (!chat.title || chat.title === "")) {
      chat.title = message.slice(0, 30) + (message.length > 30 ? "..." : "");
      await chat.save();
    }

    res.json(newMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================
// Update chat title
// ==========================
router.put("/:chatId/title", verifyToken, async (req, res) => {
  try {
    const { title } = req.body;
    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.chatId, userId: req.userId },
      { title },
      { new: true }
    );
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    res.json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating chat title" });
  }
});


// 💬 New chat
router.post("/new", verifyToken, async (req, res) => {
  try {
    const chat = new Chat({ userId: req.userId, messages: [] });
    await chat.save();
    res.json(chat);
  } catch (err) {
    console.error("Create chat error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// 💬 Send message with context
router.post("/:chatId/message", verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message, edited, editedMessageId } = req.body;

    if (!message || !message.trim()) return res.status(400).json({ message: "Message text required" });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const userId = req.userId;
    const [user, goals, transactions] = await Promise.all([
      User.findById(userId).lean(),
      Goal.find({ userId }).lean(),
      Transaction.find({ userId }).lean(),
    ]);

    // If edited: update the existing user message in chat.messages
    let userMessageIndex = -1;
    if (edited && editedMessageId) {
      userMessageIndex = chat.messages.findIndex(
        (m) => m._id && m._id.toString() === editedMessageId.toString() && m.sender === "user"
      );
      if (userMessageIndex !== -1) {
        chat.messages[userMessageIndex].text = message;
        chat.messages[userMessageIndex].timestamp = new Date();
      } else {
        // If we couldn't find the message, fall back to appending a user message
        chat.messages.push({ sender: "user", text: message });
        userMessageIndex = chat.messages.length - 1;
      }
    } else {
      // Not an edit: push new user message
      chat.messages.push({ sender: "user", text: message });
      userMessageIndex = chat.messages.length - 1;
    }

    // Determine whether this is a casual message or finance-related (optional - can reuse your logic)
    const casualPatterns = /^(hi|hello|hey|hlo|how are you|who are you|ok|thanks|thank you)$/i;
    const financeScope = /(spend|expense|income|goal|saving|budget|money|finance|amount|balance|house|car|buy|plan|achieve|target|worth|invest|investment|save|loan|dream|property|debt|rent|bill|wallet|tiffin|restaurant|startup|profit|loss)/i;

    let aiReply;
    if (casualPatterns.test(message.trim())) {
      aiReply = "Hey there! 👋 I’m Lakshmi Loop, your AI finance buddy. How can I assist you today?";
    } else if (!financeScope.test(message)) {
      // Still try to be helpful but short
      aiReply = "Hi! 😊 I can help with finance, goals, and savings. Ask me anything about your money or goals.";
    } else {
      // Build prompt and get reply from Gemini
      const prompt = buildDataDrivenPrompt(user, goals, transactions, message);
      aiReply = await generateGeminiReply(prompt);
    }

    // Now insert/replace the AI reply in chat.messages immediately after the user message index
    const insertPos = userMessageIndex + 1;
    // Find existing AI msg right after user message (if there is one)
    if (chat.messages[insertPos] && chat.messages[insertPos].sender === "ai") {
      // Replace existing AI message
      chat.messages[insertPos].text = aiReply;
      chat.messages[insertPos].timestamp = new Date();
    } else {
      // Insert new AI message after user message
      chat.messages.splice(insertPos, 0, { sender: "ai", text: aiReply });
    }

    await chat.save();

    return res.json({ reply: aiReply });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});


// 🧾 Chat history
router.get("/history", verifyToken, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.userId }).select("_id title createdAt");
    res.json(chats);
  } catch (err) {
    console.error("Fetch chats error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// 🧾 Full chat
router.get("/:chatId", verifyToken, async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.chatId, userId: req.userId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    res.json(chat);
  } catch (err) {
    console.error("Get chat error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ✏️ Rename chat
router.put("/:chatId", verifyToken, async (req, res) => {
  try {
    const { title } = req.body;
    const chat = await Chat.findByIdAndUpdate(req.params.chatId, { title }, { new: true });
    res.json(chat);
  } catch (err) {
    console.error("Rename chat error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ❌ Delete chat
router.delete("/:chatId", verifyToken, async (req, res) => {
  try {
    await Chat.findByIdAndDelete(req.params.chatId);
    res.json({ message: "Chat deleted" });
  } catch (err) {
    console.error("Delete chat error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
