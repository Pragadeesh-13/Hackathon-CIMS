🏥 AI-Enhanced Clinic Inventory Management System
📌 Problem Statement – HC2: Clinic Inventory Management System

Efficient management of medical supplies (medications, consumables, equipment) is vital to avoid shortages, reduce waste, and maintain patient care standards.
🚀 Our Solution

We developed a full-stack inventory platform with:

    Vanilla JavaScript frontend

    Node.js + Express backend

    Model Context Protocol (MCP) + Google Gemini AI for real-time database analysis

    Interactive AI Assistant that staff can chat with to instantly retrieve inventory information.

✅ Core Requirements – Achieved
📦 Record Current Stock & Usage

    Tracks all items with stock counts, thresholds, and expiry dates.

    Logs and analyzes usage rates over time.

🚨 Alert Staff

    Low stock alerts with priority indicators.

    Expiry alerts for upcoming expirations.

📈 Suggest Restocking Orders

    AI-driven suggestions based on usage history and trends.

🎁 Bonus Features – Implemented & Expanded

    Barcode Scanning Simulation for rapid item lookup & update.

    Automated Purchase Orders triggered when stock falls below threshold.

    Predictive Restocking to forecast stock-out dates.

    Priority-Based Restocking for essential medical items first.

🤖 AI Assistant – Ask Anything, Get Instant Answers

A Gemini AI-powered chatbot connected via MCP to the live database allows staff to query inventory in plain language.

Example Queries:

    “Which medicines expire next month?”

    “What’s the current stock of surgical gloves?”

    “Show me items with the fastest usage rate this week.”

    “List suppliers for items below the minimum threshold.”

🛠️ Tech Stack

    Frontend: HTML, CSS, Vanilla JavaScript

    Backend: Node.js, Express.js

    Database: JSON (can be replaced with MongoDB/MySQL)

    AI: Google Gemini API via MCP

    Barcode Simulation: JS-based scanner mock

    Environment Management: dotenv

⚙️ Installation & Setup
1️⃣ Clone the Repository

git clone https://github.com/your-username/clinic-inventory-ai.git
cd clinic-inventory-ai

2️⃣ Install Dependencies

npm install

3️⃣ Configure Environment Variables

Create a .env file in the root directory:

PORT=5000
GEMINI_API_KEY=your_google_gemini_api_key
INVENTORY_FILE=./data/inventory.json
USAGE_FILE=./data/usage.json

4️⃣ Run the Backend Server

node server.js

The backend will start at http://localhost:5000
5️⃣ Open the Frontend

Simply open the index.html file in your browser OR
serve it using a simple HTTP server:

npx http-server .

6️⃣ Using the AI Assistant

    The chatbot will be available on the frontend.

    You can ask questions in plain English, and it will query live data.
