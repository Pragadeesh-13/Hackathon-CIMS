# 🏥 Clinic Inventory Management System

A comprehensive clinic inventory management system built with vanilla HTML, CSS, JavaScript frontend and Node.js Express backend.

![Clinic Management System](https://img.shields.io/badge/Status-Active-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

### 📊 Inventory Management
- Real-time inventory tracking with stock levels
- Expiration date monitoring and alerts
- Barcode scanning simulation
- Automated low stock notifications
- Comprehensive item categorization

### 📈 Analytics & Reporting  
- Interactive charts with Chart.js
- Usage pattern analysis
- Restock recommendations based on consumption trends
- Purchase order automation
- Historical usage tracking

### 🔐 Authentication System
- Secure login/signup with SHA-256 password hashing
- Role-based access control (Pharmacist & Admin)
- Session management with token-based auth
- Professional authentication UI

### 🎨 Modern UI/UX
- **Poppins Font Integration** - Professional typography throughout
- Responsive design for all screen sizes  
- Modern CSS with gradients and animations
- Intuitive dashboard with quick actions
- Alert system with visual indicators

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd clinic-inventory-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   # Or manually: node server.js
   ```

4. **Access the application**
   - Main Dashboard: http://localhost:3000
   - Authentication: http://localhost:3000/auth.html

## 🔑 Demo Credentials

### Pharmacist Account
- **Email**: `pharmacist@clinic.com`
- **Password**: `password123`

### Admin Account  
- **Email**: `admin@clinic.com`
- **Password**: `admin123`

## 📁 Project Structure

```
clinic-inventory-management/
├── server.js                 # Express backend server
├── package.json              # Dependencies and scripts
├── data/                     # JSON file database
│   ├── inventory.json        # Inventory items
│   ├── users.json           # User accounts  
│   ├── usage_history.json   # Usage tracking
│   └── purchase_orders.json # Purchase orders
└── public/                  # Frontend assets
    ├── index.html          # Main dashboard
    ├── auth.html           # Authentication page
    ├── css/
    │   ├── style.css       # Main application styles
    │   └── auth.css        # Authentication styles
    └── js/
        ├── app.js          # Main application logic
        └── auth.js         # Authentication logic
```

## 🛠️ API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - New user registration  
- `POST /api/logout` - User logout

### Inventory Management
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Add new item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item

### Usage & Analytics
- `POST /api/usage` - Record item usage
- `GET /api/usage-history` - Get usage history
- `GET /api/alerts` - Get system alerts
- `GET /api/restock-suggestions` - Get restock recommendations

### Purchase Orders
- `GET /api/purchase-orders` - Get all purchase orders
- `POST /api/purchase-orders` - Create purchase order
- `POST /api/automated-restock-preview` - Preview automated restock

## 🔧 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **File System (fs)** - JSON file-based database
- **Crypto** - Password hashing and security

### Frontend  
- **Vanilla JavaScript** - No frameworks, pure JS
- **HTML5 & CSS3** - Modern web standards
- **Chart.js** - Interactive data visualization
- **Google Fonts (Poppins)** - Professional typography

### Security
- **SHA-256 Hashing** - Secure password storage
- **Salt-based Encryption** - Enhanced security
- **Role-based Access Control** - User permission management
- **Token-based Authentication** - Session management

## 🎯 Key Features Details

### Smart Restock System
- Analyzes usage patterns automatically
- Generates purchase orders based on consumption trends
- Considers lead times and minimum stock levels
- Prevents stockouts with predictive analytics

### Professional Authentication
- Modern tabbed interface for login/signup
- Real-time form validation
- Secure password requirements
- Role-based dashboard redirection

### Advanced Analytics
- Interactive charts with hover effects
- Usage trend visualization  
- Stock level monitoring
- Expiration date tracking

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Made with ❤️ for healthcare professionals**
