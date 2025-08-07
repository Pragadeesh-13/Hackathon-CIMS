# Clinic Inventory Management System

A comprehensive web-based inventory management system designed specifically for clinics and hospitals to track medical supplies, medications, and equipment efficiently.

## 🏥 Features

### Core Features
- **Inventory Tracking**: Record and monitor current stock levels of medical items
- **Low Stock Alerts**: Automatic notifications when stock falls below minimum thresholds  
- **Expiration Monitoring**: Track expiration dates and alert when items are nearing expiry
- **Usage Tracking**: Record item usage with detailed history and notes
- **Restock Suggestions**: AI-driven recommendations based on usage patterns

### Bonus Features
- **Barcode Scanner Simulation**: Easy inventory updates through barcode scanning
- **Automated Purchase Orders**: Generate purchase orders when stock levels drop
- **Real-time Dashboard**: Visual overview of inventory status and alerts
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🚀 Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation

1. **Clone or download the project**
   ```bash
   cd clinic-inventory-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
clinic-inventory-management/
├── server.js                 # Express backend server
├── package.json              # Project dependencies and scripts
├── public/                   # Frontend assets
│   ├── index.html           # Main application interface
│   ├── css/
│   │   └── style.css        # Application styling
│   └── js/
│       └── app.js           # Frontend JavaScript logic
├── data/                    # JSON data storage
│   ├── inventory.json       # Inventory items data
│   ├── usage_history.json   # Usage tracking records
│   └── purchase_orders.json # Purchase orders data
└── .github/
    └── copilot-instructions.md # Development guidelines
```

## 🎯 Usage Guide

### Dashboard
- View key statistics: total items, low stock alerts, expiring items
- Quick access to recent alerts and common actions
- Real-time overview of inventory health

### Inventory Management
- **Add Items**: Click "Add New Item" to register new medical supplies
- **Edit Items**: Use the edit button to update item details
- **Search**: Use the search bar to find specific items quickly
- **Status Monitoring**: Visual indicators show stock status (Good/Low/Critical/Expired)

### Alert System
- **Low Stock Alerts**: Automatically generated when stock ≤ minimum threshold
- **Expiration Alerts**: Warnings for items expiring within 7 days
- **Critical Alerts**: Immediate attention needed (out of stock, expired)

### Usage Tracking
- Record item consumption with quantity and optional notes
- Automatic stock level updates
- Complete usage history with timestamps
- Usage pattern analysis for restock suggestions

### Barcode Scanner
- Enter or scan barcodes to quickly locate items
- Sample barcodes provided for testing
- Instant item information display
- Quick actions: edit item or record usage

### Restock Management
- Smart suggestions based on usage patterns and current stock
- Priority-based ordering (High/Medium priority items)
- One-click purchase order generation
- Supplier and order tracking

## 🔧 API Endpoints

### Inventory
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Add new item
- `PUT /api/inventory/:id` - Update existing item
- `DELETE /api/inventory/:id` - Delete item

### Usage Tracking
- `POST /api/usage` - Record item usage
- `GET /api/usage-history` - Get usage history

### Alerts & Analytics
- `GET /api/alerts` - Get current alerts
- `GET /api/restock-suggestions` - Get restock recommendations

### Purchase Orders
- `GET /api/purchase-orders` - Get all purchase orders
- `POST /api/purchase-orders` - Create new purchase order

### Barcode Scanner
- `POST /api/scan-barcode` - Scan barcode and retrieve item info

## 💾 Data Storage

The application uses JSON files for simple, file-based data persistence:

- **inventory.json**: Stores all inventory items with details like name, category, stock levels, expiration dates
- **usage_history.json**: Records all usage transactions with timestamps and notes
- **purchase_orders.json**: Manages purchase order history and status

## 🎨 User Interface

### Modern Design
- Clean, professional interface suitable for medical environments
- Intuitive navigation with tabbed interface
- Responsive design works on all devices
- Visual status indicators and alerts

### Color Coding
- **Green**: Good stock levels, successful actions
- **Yellow**: Warning states, low stock
- **Red**: Critical alerts, expired items
- **Blue**: Information, neutral actions

## 🔒 Sample Data

The system comes with pre-loaded sample data including:
- Common medical supplies (medications, PPE, disposables)
- Sample barcodes for testing scanner functionality
- Usage history examples
- Various item categories

## 🛠️ Customization

### Adding New Categories
Edit the category dropdown in `public/index.html`:
```html
<option value="New Category">New Category</option>
```

### Modifying Alert Thresholds
Adjust alert settings in `server.js`:
```javascript
// Change expiration warning from 7 to 14 days
if (isExpiringWithinDays(item.expirationDate, 14)) {
```

### Styling Changes
Customize the appearance by editing `public/css/style.css`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License - see the package.json file for details.

## 🆘 Support

For support and questions:
- Check the sample data and test with provided barcodes
- Review the API documentation above
- Inspect browser console for debugging information

## 🚧 Future Enhancements

- Database integration (MySQL, PostgreSQL)
- User authentication and role management
- Advanced reporting and analytics
- Integration with actual barcode scanners
- Email notifications for alerts
- Backup and restore functionality
- Multi-location support

---

**Built with ❤️ for healthcare professionals**
