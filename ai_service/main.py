# ----------------------------
# Flask + MongoDB + Gemini AI + Receipt Parsing Backend (Production Ready)
# ----------------------------
import os
import time
import traceback
import logging
import re
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId
import pandas as pd
from PIL import Image
import pytesseract
from pdf2image import convert_from_bytes
from dotenv import load_dotenv
import google.generativeai as genai

# ----------------------------
# Logging setup
# ----------------------------
logging.basicConfig(
    level=logging.INFO,
    filename="app.log",
    format="%(asctime)s [%(levelname)s] %(message)s",
)

# ----------------------------
# Load environment variables
# ----------------------------
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    logging.error("GEMINI_API_KEY not found in environment.")
    raise ValueError("GEMINI_API_KEY not found in environment.")

genai.configure(api_key=API_KEY)

# Choose a valid Gemini model
try:
    model = genai.GenerativeModel("models/gemini-2.5-flash")
except Exception:
    model = genai.GenerativeModel("models/gemini-pro")

# ----------------------------
# Flask app setup
# ----------------------------
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5MB max upload

# Replace with your production frontend URL
CORS(app, origins=["https://yourfrontend.com"], methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Content-Type", "Authorization"])

# ----------------------------
# MongoDB setup
# ----------------------------
mongo_client = MongoClient(os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017"))
db = mongo_client["FinanceTracker"]
transactions_col = db["transactions"]
goals_col = db["goals"]

# ----------------------------
# Tesseract OCR Path (Windows)
# ----------------------------
pytesseract.pytesseract.tesseract_cmd = os.getenv(
    "TESSERACT_PATH",
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

# ----------------------------
# Helpers
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

def extract_text(file):
    try:
        filename = file.filename.lower()
        if filename.endswith(".pdf"):
            pages = convert_from_bytes(file.read(), dpi=300)
            img = pages[0]  # Only first page
        else:
            img = Image.open(file)
        text = pytesseract.image_to_string(img)
        return text
    except Exception as e:
        logging.error(f"OCR error: {e}")
        return ""

def parse_receipt(text):
    result = {"amount": "", "category": "Other", "date": "", "paymentMethod": "Others", "description": ""}
    
    # Amount
    amount_match = re.findall(r"\b\d+(?:\.\d{1,2})?\b", text)
    if amount_match:
        result["amount"] = amount_match[-1]

    # Date
    date_match = re.findall(r"\b\d{2}[/-]\d{2}[/-]\d{4}\b|\b\d{4}[/-]\d{2}[/-]\d{2}\b", text)
    result["date"] = date_match[0] if date_match else datetime.today().strftime("%Y-%m-%d")

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
# Routes
# ----------------------------
@app.route("/summary", methods=["POST"])
def generate_predictive_summary():
    try:
        user_id = request.json.get("userId")
        if not user_id:
            return jsonify({"summary": "No userId provided"}), 400

        # Handle ObjectId and string
        try:
            query = {"userId": ObjectId(user_id)}
        except (InvalidId, TypeError):
            query = {"userId": user_id}

        transactions = list(transactions_col.find(query, {"_id": 0}))
        goals = list(goals_col.find(query, {"_id": 0}))

        if not transactions:
            return jsonify({"summary": "No transactions found for this user."})

        monthly_df = preprocess_transactions(transactions)
        trend_data = monthly_df.to_dict(orient="records") if monthly_df is not None else []
        if len(trend_data) > 20:
            trend_data = trend_data[-20:]

        prompt = f"""
You are a friendly and smart financial advisor.
Look at the user's transaction trends and goals below. Write a short, clear report in under 200 words.

Transactions:
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
            except Exception as e:
                logging.warning(f"Gemini API attempt {attempt+1} failed: {e}")
                time.sleep(2)

        if not summary_text.strip():
            summary_text = generate_fallback_insights(transactions, goals)

        return jsonify({"summary": summary_text[:700] + "..." if len(summary_text) > 700 else summary_text})

    except Exception as e:
        logging.error(traceback.format_exc())
        return jsonify({"summary": "Server error occurred."}), 500

@app.route("/parse-receipt", methods=["POST"])
def parse_receipt_api():
    if "receipt" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["receipt"]

    try:
        logging.info(f"Received file: {file.filename}, type: {file.content_type}")
        file.stream.seek(0)
        text = extract_text(file)
        parsed_data = parse_receipt(text)
        logging.info(f"Parsed receipt data: {parsed_data}")
        return jsonify(parsed_data)
    except Exception as e:
        logging.error(traceback.format_exc())
        return jsonify({"error": f"Failed to process receipt: {str(e)}"}), 500

# ----------------------------
# Run Flask (for local debugging only)
# ----------------------------
if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5002)
