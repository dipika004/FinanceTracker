# ----------------------------
# Flask + MongoDB + Gemini AI + Receipt Parsing Backend (Updated)
# ----------------------------
from flask import Flask, jsonify, request
from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId
import google.generativeai as genai
from dotenv import load_dotenv
import os
import time
import traceback
import pandas as pd
from flask_cors import CORS
import pytesseract
from PIL import Image
import re
from pdf2image import convert_from_bytes
from datetime import datetime

# ----------------------------
# Set Tesseract path (Windows)
# ----------------------------
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# ----------------------------
# Flask setup
# ----------------------------
app = Flask(__name__)
CORS(
    app,
    origins=["http://localhost:5173"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# ----------------------------
# Load environment variables
# ----------------------------
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("❌ GEMINI_API_KEY not found in .env file.")
genai.configure(api_key=api_key)

# ----------------------------
# Choose Gemini model
# ----------------------------
try:
    model = genai.GenerativeModel("models/gemini-2.5-flash")
except Exception:
    model = genai.GenerativeModel("models/gemini-pro")

# ----------------------------
# MongoDB setup
# ----------------------------
mongo_client = MongoClient("mongodb://127.0.0.1:27017")
db = mongo_client["FinanceTracker"]
transactions_col = db["transactions"]
goals_col = db["goals"]

# ----------------------------
# Helper: Preprocess transactions
# ----------------------------
def preprocess_transactions(transactions):
    if not transactions:
        return None
    df = pd.DataFrame(transactions)
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        df["month"] = df["date"].dt.strftime("%Y-%m")
    else:
        df["month"] = "Unknown"
    df["amount"] = pd.to_numeric(df.get("amount", 0), errors="coerce").fillna(0)
    monthly_summary = (
        df.groupby(["month", "category"], as_index=False)["amount"]
        .sum()
        .sort_values("month")
    )
    return monthly_summary

# ----------------------------
# Helper: Fallback summary
# ----------------------------
def generate_fallback_insights(transactions, goals):
    category_totals = {}
    for t in transactions:
        cat = t.get("category", "Other")
        amt = float(t.get("amount", 0))
        category_totals[cat] = category_totals.get(cat, 0) + amt

    text = "📊 Basic Spending Summary:\n"
    for cat, amt in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:5]:
        text += f"- {cat}: ₹{amt:.2f}\n"

    if goals:
        text += "\n🎯 Goal Progress:\n"
        for g in goals:
            name = g.get("goalName", "Unnamed Goal")
            target = float(g.get("targetAmount", 0))
            saved = float(g.get("savedSoFar", 0))
            pct = (saved / target * 100) if target else 0
            text += f"- {name}: {pct:.1f}% complete\n"
    return text

# ----------------------------
# Route: Predictive summary
# ----------------------------
@app.route("/summary", methods=["POST"])
def generate_predictive_summary():
    try:
        user_id = request.json.get("userId")
        if not user_id:
            return jsonify({"summary": "No userId provided"}), 400

        try:
            query = {"userId": ObjectId(user_id)}
        except (InvalidId, TypeError):
            query = {"userId": user_id}

        transactions = list(transactions_col.find(query, {"_id": 0}))
        if not transactions:
            return jsonify({"summary": "No transactions found for this user."})

        goals = list(goals_col.find(query, {"_id": 0}))
        monthly_df = preprocess_transactions(transactions)
        trend_data = monthly_df.to_dict(orient="records") if monthly_df is not None else []
        if len(trend_data) > 20:
            trend_data = trend_data[-20:]

        # ----------------------------
        # Improved Gemini AI prompt
        # ----------------------------
        prompt = f"""
You are a professional and friendly financial advisor. 
Analyze the user's transactions and financial goals below and create a clear, structured financial report in **under 200 words**.

The report should follow these rules:
1. Use **symbols for headings**:
   💰 Spending Overview
   📈 Trends & Insights
   💡 Tips for Saving
   🎯 Goal Progress
2. Under each heading, use **short bullet points**, keeping numbers and currency together.
3. All numbers should appear **fully, without splitting across lines**.
4. Ensure readability: one bullet per line, avoid unnecessary symbols like '*'.
5. Use simple, professional language and keep it engaging.

Transactions (last 20 records):
{trend_data}

Goals:
{goals}
"""


        summary_text = ""
        for attempt in range(3):
            try:
                response = model.generate_content(prompt)
                if hasattr(response, "text") and response.text:
                    summary_text = response.text.strip()
                    break
            except Exception:
                time.sleep(2)

        if not summary_text.strip():
            summary_text = generate_fallback_insights(transactions, goals)

        if len(summary_text) > 700:
            summary_text = summary_text[:700] + "..."

        return jsonify({"summary": summary_text})

    except Exception:
        traceback.print_exc()
        return jsonify({"summary": "Server error occurred."}), 500

# ----------------------------
# Helper: Extract text from receipt (PDF/Image)
# ----------------------------
def extract_text(file):
    try:
        filename = file.filename.lower()
        if filename.endswith(".pdf"):
            pages = convert_from_bytes(file.read(), dpi=300)
            img = pages[0]
        else:
            img = Image.open(file)
        text = pytesseract.image_to_string(img)
        return text
    except Exception as e:
        print(f"❌ OCR error: {e}")
        return ""

# ----------------------------
# Helper: Parse receipt text
# ----------------------------
def parse_receipt(text):
    result = {"amount": 0, "category": "Other", "date": "", "paymentMethod": "Others", "description": ""}

    # Amount
    amount_match = re.findall(r"\b\d+(?:\.\d{1,2})?\b", text)
    if amount_match:
        try:
            result["amount"] = float(amount_match[-1])
        except:
            result["amount"] = 0

    # Date
    date_match = re.findall(r"\b\d{2}[/-]\d{2}[/-]\d{4}\b|\b\d{4}[/-]\d{2}[/-]\d{2}\b", text)
    if date_match:
        result["date"] = date_match[0]
    else:
        result["date"] = datetime.today().strftime("%Y-%m-%d")

    # Category
    keywords = {
        "Food": ["restaurant", "cafe", "meal", "dining"],
        "Transport": ["taxi", "uber", "bus", "train", "fuel"],
        "Shopping": ["store", "shop", "mall", "clothes"],
        "Utilities": ["electricity", "water", "bill", "internet"]
    }
    for cat, kw_list in keywords.items():
        if any(kw.lower() in text.lower() for kw in kw_list):
            result["category"] = cat
            break

    # Payment Method
    if "cash" in text.lower():
        result["paymentMethod"] = "Cash"
    elif "credit" in text.lower():
        result["paymentMethod"] = "Credit Card"
    elif "debit" in text.lower():
        result["paymentMethod"] = "Debit Card"

    # Description
    lines = text.strip().split("\n")
    result["description"] = lines[0] if lines else "Receipt"

    return result

# ----------------------------
# Route: Parse receipt & save to MongoDB
# ----------------------------
@app.route("/parse-receipt", methods=["POST"])
def parse_receipt_api():
    if "receipt" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["receipt"]
    user_id = request.form.get("userId")
    if not user_id:
        return jsonify({"error": "No userId provided"}), 400

    try:
        file.stream.seek(0)
        text = extract_text(file)
        parsed_data = parse_receipt(text)

        # Assign userId
        parsed_data["userId"] = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id

        # Save transaction
        transactions_col.insert_one(parsed_data)
        return jsonify({"message": "Transaction added successfully!", "transaction": parsed_data})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Failed to process receipt: {str(e)}"}), 500

# ----------------------------
# Run Flask
# ----------------------------
if __name__ == "__main__":
    app.run(port=5002, debug=True)
