from flask import Flask, request, jsonify
import pytesseract
from PIL import Image
import re
import os

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# OCR receipt parsing endpoint
@app.route("/parse-receipt", methods=["POST"])
def parse_receipt():
    if "receipt" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["receipt"]
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    try:
        # OCR using pytesseract
        text = pytesseract.image_to_string(Image.open(file_path))

        # Extract Amount (first decimal number)
        amount_match = re.search(r"\d+(?:\.\d{1,2})?", text)
        amount = amount_match.group() if amount_match else ""

        # Extract Date (dd/mm/yyyy or dd-mm-yyyy)
        date_match = re.search(r"\b\d{2}[/-]\d{2}[/-]\d{4}\b", text)
        date = date_match.group() if date_match else ""

        # Extract description (first 50 chars)
        description = text[:50].strip()

        # Optional: ML model for category detection
        # For now defaulting to Expense
        response = {
            "amount": amount,
            "date": date,
            "description": description,
            "type": "Expense",
            "category": "",
            "paymentMethod": "",
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
