Problem Statement HC2: Clinic Inventory Management System

Context:
Efficient management of medical supplies (medications, consumables, equipment) is vital to avoid shortages, reduce waste, and maintain patient care standards.

Challenge:
Build a digital system to track, manage, and optimize clinic or hospital inventory.
✅ Our Solution: AI-Enhanced Clinic Inventory Management System

We developed a full-stack inventory platform with a Vanilla JavaScript frontend and Node.js + Express backend, powered by Model Context Protocol (MCP) + Google Gemini AI for real-time database analysis and an interactive AI assistant that staff can chat with to instantly retrieve inventory information.
Core Requirements — Achieved

    Record Current Stock & Usage

        Tracks all items with stock counts, thresholds, and expiry dates.

        Usage rates logged and analyzed over time.

    Alert Staff

        Low stock and upcoming expiry alerts with visual priority indicators.

    Suggest Restocking Orders

        AI-driven restock suggestions based on usage history and trends.

Bonus Features — Implemented & Expanded

    Barcode Scanning Simulation for rapid item lookup & update.

    Automated Purchase Orders triggered when stock falls below threshold.

    Predictive Restocking to forecast stock-out dates.

    Priority-Based Restocking for essential medical items first.

💡 AI Assistant – Ask Anything, Get Instant Answers

A built-in Gemini AI-powered chatbot connected via MCP to the live database allows staff to query inventory in plain language:

Examples:

    “Which medicines expire next month?”

    “What’s the current stock of surgical gloves?”

    “Show me items with the fastest usage rate this week.”

    “List suppliers for items below the minimum threshold.”

The assistant delivers accurate, real-time answers without manual searching, dramatically improving decision-making speed.
Tech Stack

    Frontend: HTML5, CSS3, Vanilla JavaScript (responsive, WCAG-compliant)

    Backend: Node.js + Express.js

    AI: Google Gemini API + Model Context Protocol (MCP) for live DB queries

    Storage: JSON (can extend to relational/NoSQL DB)

    Visualization: Chart.js

    Security: SHA-256 hashing, token-based authentication

Impact

Our system transforms clinic inventory management into a proactive, AI-assisted process:

    Shortages prevented via predictive analytics.

    Waste reduced through expiry alerts and optimized ordering.

    Staff empowered by an AI assistant that understands and responds to any inventory-related question instantly.
