<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Clinic Inventory Management System

This is a comprehensive clinic inventory management system built with vanilla HTML, CSS, JavaScript frontend and Node.js Express backend.

## Project Structure
- `server.js` - Express backend server with REST API endpoints
- `public/` - Frontend assets (HTML, CSS, JavaScript)
- `data/` - JSON files for data persistence (inventory, usage history, purchase orders)

## Key Features
- Inventory tracking with stock levels and expiration dates
- Low stock and expiration alerts
- Usage tracking and history
- Restock suggestions based on usage patterns
- Barcode scanning simulation
- Automated purchase order generation
- Responsive web interface

## Development Guidelines
- Use vanilla JavaScript (no frameworks) for frontend
- Follow REST API conventions for backend endpoints
- Use JSON files for data persistence (simple file-based database)
- Implement proper error handling and user feedback
- Maintain responsive design principles
- Follow medical/healthcare terminology and best practices

## API Endpoints
- GET/POST/PUT/DELETE `/api/inventory` - Inventory management
- POST `/api/usage` - Record item usage
- GET `/api/alerts` - Get system alerts
- GET `/api/restock-suggestions` - Get restock recommendations
- POST `/api/purchase-orders` - Create purchase orders
- POST `/api/scan-barcode` - Simulate barcode scanning

## UI Components
- Dashboard with statistics and quick actions
- Inventory table with search and filtering
- Alert system with visual indicators
- Usage tracking forms
- Barcode scanner interface
- Modal dialogs for item management
