# 🏥 Clinic Inventory Management System

A comprehensive, modern clinic inventory management system built with vanilla JavaScript frontend and Node.js Express backend. This system helps healthcare facilities efficiently manage their medical supplies with intelligent restocking, usage tracking, and automated alerts.

## ✨ Features

### 📊 Core Inventory Management
- **Real-time Stock Tracking** - Monitor current stock levels, minimum thresholds, and expiration dates
- **Smart Alerts** - Low stock and expiration date notifications with visual indicators
- **Usage History** - Track item consumption patterns and generate insights
- **Barcode Simulation** - Quick item lookup and stock updates

### 🤖 AI-Powered Features
- **Automated Restock Suggestions** - AI analyzes usage patterns to suggest optimal restock quantities
- **Smart Charts & Analytics** - Visual inventory analysis with AI-generated insights
- **Predictive Restocking** - Forecast when items will run out based on usage trends
- **Priority-Based Restocking** - Focus on high-priority and critical items

### 👥 User Management & Security
- **Role-Based Access Control** - Separate access levels for pharmacists and administrators
- **Secure Authentication** - Encrypted password storage with token-based sessions
- **User Profile Management** - Personal dashboards with role-specific features

### 📋 Purchase Order Management
- **Automated PO Generation** - Create purchase orders from restock suggestions
- **Supplier Management** - Track preferred suppliers and contact information
- **Order History** - Complete audit trail of all purchase orders

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/[your-username]/clinic-inventory-system.git
   cd clinic-inventory-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your API keys
   ```

4. **Start the server**
   ```bash
   npm start
   # or
   node server.js
   ```

5. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - Use demo credentials to login (see Demo Accounts section)

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory with:
```bash
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
PORT=3000
```

### Demo Accounts
The system comes with pre-configured demo accounts:

**Pharmacist Account:**
- Email: `pharmacist@clinic.com`
- Password: `password123`

**Administrator Account:**
- Email: `admin@clinic.com`
- Password: `admin123`

## 📁 Project Structure

```
clinic-inventory-system/
├── server.js                 # Express backend server
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules
├── README.md                # Project documentation
├── data/                    # JSON data storage
│   ├── inventory.json       # Inventory items data
│   ├── users.json          # User accounts data
│   ├── usage_history.json  # Item usage tracking
│   └── purchase_orders.json # Purchase order records
└── public/                  # Frontend assets
    ├── index.html          # Main application page
    ├── auth.html           # Authentication page
    ├── css/
    │   ├── style.css       # Main application styles
    │   └── auth.css        # Authentication page styles
    └── js/
        ├── app.js          # Main application logic
        └── auth.js         # Authentication logic
```

## 🛠️ API Endpoints

### Authentication
- `POST /api/login` - User authentication
- `POST /api/register` - New user registration
- `POST /api/logout` - User logout

### Inventory Management
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Add new inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item

### Usage Tracking
- `POST /api/usage` - Record item usage
- `GET /api/usage-history` - Get usage history

### AI Features
- `GET /api/restock-suggestions` - Get AI-powered restock suggestions
- `GET /api/restock-chart` - Get chart data with AI insights
- `GET /api/automated-restock-preview` - Preview automated restock
- `POST /api/automated-restock-execute` - Execute automated restock

### Alerts & Notifications
- `GET /api/alerts` - Get system alerts
- `GET /api/dashboard-stats` - Get dashboard statistics

## 🎨 UI Features

### Responsive Design
- **Mobile-First Approach** - Optimized for all device sizes
- **Modern CSS Grid/Flexbox** - Professional, clean layout
- **Interactive Elements** - Smooth animations and transitions
- **Accessibility** - WCAG compliant design principles

### Visual Components
- **Dashboard Cards** - Real-time statistics and quick actions
- **Data Tables** - Sortable, filterable inventory listings
- **Modal Dialogs** - Intuitive forms for data entry
- **Alert System** - Color-coded notifications and warnings
- **Progress Indicators** - Visual feedback for user actions

## 🔒 Security Features

- **Password Hashing** - SHA-256 encryption with salt
- **Token-Based Auth** - Secure session management
- **Input Validation** - SQL injection and XSS protection
- **Role-Based Access** - Restricted functionality by user role

## 📊 Analytics & Reporting

- **Usage Patterns** - Track consumption trends over time
- **Stock Predictions** - AI-powered forecasting
- **Visual Charts** - Interactive charts with Chart.js
- **Export Capabilities** - Download reports and data

## 🚀 Deployment

### Development Server
```bash
npm run dev
```

### Production Deployment
1. Set environment variables
2. Install production dependencies: `npm install --production`
3. Start server: `npm start`

### Docker (Optional)
```bash
# Build image
docker build -t clinic-inventory .

# Run container
docker run -p 3000:3000 clinic-inventory
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/[your-username]/clinic-inventory-system/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🙏 Acknowledgments

- **Chart.js** - Beautiful data visualization
- **Font Awesome** - Comprehensive icon library
- **Google AI** - Intelligent analytics and insights
- **Express.js** - Fast, minimal web framework
- **Node.js** - JavaScript runtime environment

---

**Built with ❤️ for healthcare professionals**
