Clinic Inventory Management System – AI-Enhanced with MCP + Gemini

Overview:
The Clinic Inventory Management System is a full-stack healthcare supply management platform with a vanilla JavaScript frontend and Node.js + Express backend.
It is enhanced with Model Context Protocol (MCP) and Google Gemini AI, enabling real-time, context-aware analysis and a built-in AI chatbot assistant.
This integration ensures the AI can directly query live database state to provide accurate, up-to-date answers, predictive insights, and automated decision support.
🚀 Core Functionalities
Inventory Management

    Real-Time Stock Tracking (current quantity, min thresholds, expiration dates)

    Smart Alerts (low stock, near expiry, visual indicators)

    Usage History (item-level consumption tracking)

    Barcode Simulation (quick lookup and instant updates)

AI + MCP Integration

    Live Data-Connected AI – Gemini reads from the database via MCP for fresh, reliable insights

    Automated Restock Suggestions – AI analyzes usage patterns to calculate optimal order sizes

    Predictive Restocking – AI forecasts depletion dates for each item

    Priority-Based Replenishment – Focus on critical medical items first

    Chatbot Assistant – Query the database conversationally (e.g., "Show me items expiring in 30 days")

User Management & Security

    Role-Based Access Control (Pharmacist / Admin)

    Secure Authentication (hashed passwords + token sessions)

    Input Validation for security against SQLi/XSS

Purchase Order System

    Automated PO Generation from AI restock recommendations

    Supplier Database with contact details

    Order History for compliance and auditing

Analytics & Reporting

    Usage trend visualization (Chart.js)

    AI-powered consumption pattern analysis

    Exportable reports (CSV/PDF)

🧠 Why This Project Stands Out

    Direct MCP–LLM Integration → AI works with live database context

    Conversational Database Queries → No SQL knowledge required

    Predictive Analytics → Prevents stockouts and reduces wastage

    Healthcare-Ready → Addresses real-world clinic needs

📂 Tech Stack

    Frontend: Vanilla JavaScript, HTML5, CSS3 (Responsive + WCAG Compliant)

    Backend: Node.js, Express.js

    AI: Google Gemini API via Model Context Protocol (MCP)

    Data Storage: JSON (local) / extendable to DB

    Visualization: Chart.js

    Security: SHA-256 hashing, token-based authentication

