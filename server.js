const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyDAlgnjMS54hi0S1zbbhScRi5BYZZ1dLVU');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data file paths
const INVENTORY_FILE = path.join(__dirname, 'data', 'inventory.json');
const USAGE_FILE = path.join(__dirname, 'data', 'usage_history.json');
const PURCHASE_ORDERS_FILE = path.join(__dirname, 'data', 'purchase_orders.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// Authentication helper functions (defined early for use in initialization)
function hashPassword(password) {
    const salt = 'clinic_inventory_salt_2025';
    return crypto.createHash('sha256').update(password + salt).digest('hex');
}

function generateAuthToken(userId) {
    const timestamp = Date.now();
    const tokenData = `${userId}_${timestamp}`;
    return crypto.createHash('sha256').update(tokenData).digest('hex');
}

// Initialize data files if they don't exist
async function initializeDataFiles() {
    try {
        await fs.access(INVENTORY_FILE);
    } catch {
        await fs.writeFile(INVENTORY_FILE, JSON.stringify([]));
    }

    try {
        await fs.access(USAGE_FILE);
    } catch {
        await fs.writeFile(USAGE_FILE, JSON.stringify([]));
    }

    try {
        await fs.access(PURCHASE_ORDERS_FILE);
    } catch {
        await fs.writeFile(PURCHASE_ORDERS_FILE, JSON.stringify([]));
    }

    try {
        await fs.access(USERS_FILE);
    } catch {
        // Create demo users
        const demoUsers = [
            {
                id: "user_001",
                firstName: "John",
                lastName: "Pharmacist",
                email: "pharmacist@clinic.com",
                role: "pharmacist",
                password: hashPassword("password123"),
                createdAt: new Date().toISOString(),
                isActive: true
            },
            {
                id: "user_002",
                firstName: "Admin",
                lastName: "User",
                email: "admin@clinic.com",
                role: "admin",
                password: hashPassword("admin123"),
                createdAt: new Date().toISOString(),
                isActive: true
            }
        ];
        await fs.writeFile(USERS_FILE, JSON.stringify(demoUsers, null, 2));
    }
}

// Helper functions
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading file:', error);
        return [];
    }
}

async function writeJsonFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing file:', error);
        throw error;
    }
}

async function validateAuthToken(token) {
    if (!token) return null;
    
    try {
        const users = await readJsonFile(USERS_FILE);
        // For simplicity, we'll validate based on token format
        // In production, you'd want to store tokens and check expiration
        if (token.length === 64) { // SHA-256 hash length
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function isExpiringWithinDays(expirationDate, days) {
    const now = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days;
}

function calculateUsageRate(usageHistory, itemId, days = 30) {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const recentUsage = usageHistory.filter(usage => 
        usage.itemId === itemId && new Date(usage.date) >= cutoffDate
    );

    const totalUsed = recentUsage.reduce((sum, usage) => sum + usage.quantity, 0);
    return totalUsed / days; // Daily usage rate
}

// Routes

// Authentication Routes
// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const users = await readJsonFile(USERS_FILE);
        const hashedPassword = hashPassword(password);
        
        const user = users.find(u => u.email === email && u.password === hashedPassword && u.isActive);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user role is allowed (only pharmacist and admin)
        if (!['pharmacist', 'admin'].includes(user.role)) {
            return res.status(403).json({ message: 'Access denied. Only pharmacists and administrators are allowed.' });
        }

        const token = generateAuthToken(user.id);
        
        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { firstName, lastName, email, role, password } = req.body;
        
        if (!firstName || !lastName || !email || !role || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate role (only allow pharmacist and admin)
        if (!['pharmacist', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Only pharmacist and admin roles are allowed.' });
        }

        const users = await readJsonFile(USERS_FILE);
        
        // Check if user already exists
        if (users.find(u => u.email === email)) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        const newUser = {
            id: `user_${generateId()}`,
            firstName,
            lastName,
            email,
            role,
            password: hashPassword(password),
            createdAt: new Date().toISOString(),
            isActive: true
        };

        users.push(newUser);
        await writeJsonFile(USERS_FILE, users);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Logout endpoint (client-side handles token removal)
app.post('/api/logout', (req, res) => {
    res.json({ success: true, message: 'Logout successful' });
});

// Get user profile
app.get('/api/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token || !(await validateAuthToken(token))) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        // For simplicity, return success if token is valid
        // In production, you'd decode the token to get user info
        res.json({
            success: true,
            message: 'Profile retrieved successfully'
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Inventory Routes
// Get all inventory items
app.get('/api/inventory', async (req, res) => {
    try {
        const inventory = await readJsonFile(INVENTORY_FILE);
        res.json(inventory);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// Add new inventory item
app.post('/api/inventory', async (req, res) => {
    try {
        const inventory = await readJsonFile(INVENTORY_FILE);
        const newItem = {
            id: generateId(),
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        inventory.push(newItem);
        await writeJsonFile(INVENTORY_FILE, inventory);
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add inventory item' });
    }
});

// Update inventory item
app.put('/api/inventory/:id', async (req, res) => {
    try {
        const inventory = await readJsonFile(INVENTORY_FILE);
        const itemIndex = inventory.findIndex(item => item.id === req.params.id);
        
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        inventory[itemIndex] = {
            ...inventory[itemIndex],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        await writeJsonFile(INVENTORY_FILE, inventory);
        res.json(inventory[itemIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update inventory item' });
    }
});

// Delete inventory item
app.delete('/api/inventory/:id', async (req, res) => {
    try {
        const inventory = await readJsonFile(INVENTORY_FILE);
        const filteredInventory = inventory.filter(item => item.id !== req.params.id);
        
        if (inventory.length === filteredInventory.length) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        await writeJsonFile(INVENTORY_FILE, filteredInventory);
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete inventory item' });
    }
});

// Record usage
app.post('/api/usage', async (req, res) => {
    try {
        const { itemId, quantity, notes } = req.body;
        
        // Update inventory quantity
        const inventory = await readJsonFile(INVENTORY_FILE);
        const itemIndex = inventory.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        if (inventory[itemIndex].currentStock < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }
        
        inventory[itemIndex].currentStock -= quantity;
        inventory[itemIndex].updatedAt = new Date().toISOString();
        await writeJsonFile(INVENTORY_FILE, inventory);
        
        // Record usage history
        const usageHistory = await readJsonFile(USAGE_FILE);
        const usageRecord = {
            id: generateId(),
            itemId,
            quantity,
            notes,
            date: new Date().toISOString()
        };
        
        usageHistory.push(usageRecord);
        await writeJsonFile(USAGE_FILE, usageHistory);
        
        res.status(201).json(usageRecord);
    } catch (error) {
        res.status(500).json({ error: 'Failed to record usage' });
    }
});

// Get alerts (low stock and expiring items)
app.get('/api/alerts', async (req, res) => {
    try {
        const inventory = await readJsonFile(INVENTORY_FILE);
        const alerts = [];
        
        inventory.forEach(item => {
            // Low stock alert
            if (item.currentStock <= item.minThreshold) {
                alerts.push({
                    type: 'low_stock',
                    severity: item.currentStock === 0 ? 'critical' : 'warning',
                    item: item.name,
                    message: `Low stock: ${item.currentStock} units remaining (min: ${item.minThreshold})`,
                    itemId: item.id
                });
            }
            
            // Expiration alert
            if (item.expirationDate) {
                if (isExpiringWithinDays(item.expirationDate, 7)) {
                    const daysToExpiry = Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
                    alerts.push({
                        type: 'expiring',
                        severity: daysToExpiry <= 3 ? 'critical' : 'warning',
                        item: item.name,
                        message: `Expires in ${daysToExpiry} days (${item.expirationDate})`,
                        itemId: item.id
                    });
                }
            }
        });
        
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

// Get restock suggestions
app.get('/api/restock-suggestions', async (req, res) => {
    try {
        const inventory = await readJsonFile(INVENTORY_FILE);
        const usageHistory = await readJsonFile(USAGE_FILE);
        const suggestions = [];
        
        inventory.forEach(item => {
            const usageRate = calculateUsageRate(usageHistory, item.id);
            
            if (item.currentStock <= item.minThreshold || usageRate > 0) {
                const daysUntilEmpty = usageRate > 0 ? item.currentStock / usageRate : null;
                const suggestedQuantity = Math.ceil(usageRate * 30); // 30 days supply
                
                suggestions.push({
                    itemId: item.id,
                    itemName: item.name,
                    currentStock: item.currentStock,
                    usageRate: Math.round(usageRate * 100) / 100,
                    daysUntilEmpty: daysUntilEmpty !== null ? Math.round(daysUntilEmpty) : null,
                    suggestedQuantity: suggestedQuantity > 0 ? suggestedQuantity : item.minThreshold * 2,
                    priority: item.currentStock <= item.minThreshold ? 'high' : 'medium'
                });
            }
        });
        
        // Sort by priority and days until empty
        suggestions.sort((a, b) => {
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (b.priority === 'high' && a.priority !== 'high') return 1;
            
            // Handle null values (when usage rate is 0)
            if (a.daysUntilEmpty === null && b.daysUntilEmpty === null) return 0;
            if (a.daysUntilEmpty === null) return 1; // null goes to end
            if (b.daysUntilEmpty === null) return -1; // null goes to end
            
            return a.daysUntilEmpty - b.daysUntilEmpty;
        });
        
        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate restock suggestions' });
    }
});

// Generate restock chart with AI insights
app.get('/api/restock-chart', async (req, res) => {
    try {
        const inventory = await readJsonFile(INVENTORY_FILE);
        const usageHistory = await readJsonFile(USAGE_FILE);
        const suggestions = [];
        
        // Get restock suggestions data
        inventory.forEach(item => {
            const usageRate = calculateUsageRate(usageHistory, item.id);
            
            if (item.currentStock <= item.minThreshold || usageRate > 0) {
                const daysUntilEmpty = usageRate > 0 ? item.currentStock / usageRate : null;
                const suggestedQuantity = Math.ceil(usageRate * 30); // 30 days supply
                
                suggestions.push({
                    itemId: item.id,
                    itemName: item.name,
                    currentStock: item.currentStock,
                    usageRate: Math.round(usageRate * 100) / 100,
                    daysUntilEmpty: daysUntilEmpty !== null ? Math.round(daysUntilEmpty) : null,
                    suggestedQuantity: suggestedQuantity > 0 ? suggestedQuantity : item.minThreshold * 2,
                    priority: item.currentStock <= item.minThreshold ? 'high' : 'medium'
                });
            }
        });

        // Sort by priority and days until empty
        suggestions.sort((a, b) => {
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (b.priority === 'high' && a.priority !== 'high') return 1;
            
            // Handle null values (when usage rate is 0)
            if (a.daysUntilEmpty === null && b.daysUntilEmpty === null) return 0;
            if (a.daysUntilEmpty === null) return 1; // null goes to end
            if (b.daysUntilEmpty === null) return -1; // null goes to end
            
            return a.daysUntilEmpty - b.daysUntilEmpty;
        });

        // Generate AI insights
        const prompt = `Analyze the following clinic inventory restock data and provide insights:

${suggestions.map(item => `- ${item.itemName}: Current Stock: ${item.currentStock}, Selling Rate: ${item.usageRate}/day, Days Until Empty: ${item.daysUntilEmpty || 'N/A'}, Suggested Quantity: ${item.suggestedQuantity}, Priority: ${item.priority}`).join('\n')}

Please provide:
1. Key insights about inventory patterns
2. Priority recommendations for restocking
3. Cost optimization suggestions
4. Risk assessment for stockouts

Keep the response concise and actionable for a clinic manager.`;

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const aiInsights = result.response.text();

        res.json({
            chartData: {
                labels: suggestions.map(item => item.itemName),
                datasets: [
                    {
                        label: 'Current Stock',
                        data: suggestions.map(item => item.currentStock),
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Suggested Quantity',
                        data: suggestions.map(item => item.suggestedQuantity),
                        backgroundColor: 'rgba(118, 75, 162, 0.8)',
                        borderColor: 'rgba(118, 75, 162, 1)',
                        borderWidth: 1
                    }
                ]
            },
            aiInsights: aiInsights
        });
    } catch (error) {
        console.error('Error generating restock chart:', error);
        res.status(500).json({ error: 'Failed to generate restock chart' });
    }
});

// Get automated restock preview (high priority items only)
app.get('/api/automated-restock-preview', async (req, res) => {
    try {
        const inventory = await readJsonFile(INVENTORY_FILE);
        const usageHistory = await readJsonFile(USAGE_FILE);
        const highPriorityItems = [];
        
        inventory.forEach(item => {
            const usageRate = calculateUsageRate(usageHistory, item.id);
            
            // Only include high priority items (current stock <= min threshold)
            if (item.currentStock <= item.minThreshold) {
                const daysUntilEmpty = usageRate > 0 ? item.currentStock / usageRate : null;
                const suggestedQuantity = Math.ceil(usageRate * 30); // 30 days supply
                
                highPriorityItems.push({
                    itemId: item.id,
                    itemName: item.name,
                    currentStock: item.currentStock,
                    minThreshold: item.minThreshold,
                    usageRate: Math.round(usageRate * 100) / 100,
                    daysUntilEmpty: daysUntilEmpty !== null ? Math.round(daysUntilEmpty) : null,
                    suggestedQuantity: suggestedQuantity > 0 ? suggestedQuantity : item.minThreshold * 2,
                    priority: 'high'
                });
            }
        });
        
        // Sort by urgency (days until empty, then by current stock percentage)
        highPriorityItems.sort((a, b) => {
            if (a.daysUntilEmpty === null && b.daysUntilEmpty === null) {
                return (a.currentStock / a.minThreshold) - (b.currentStock / b.minThreshold);
            }
            if (a.daysUntilEmpty === null) return 1;
            if (b.daysUntilEmpty === null) return -1;
            return a.daysUntilEmpty - b.daysUntilEmpty;
        });
        
        res.json({
            items: highPriorityItems,
            totalItems: highPriorityItems.length,
            totalQuantity: highPriorityItems.reduce((sum, item) => sum + item.suggestedQuantity, 0)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate automated restock preview' });
    }
});

// Execute automated restock (high priority items only)
app.post('/api/automated-restock', async (req, res) => {
    try {
        const inventory = await readJsonFile(INVENTORY_FILE);
        const usageHistory = await readJsonFile(USAGE_FILE);
        const purchaseOrders = await readJsonFile(PURCHASE_ORDERS_FILE);
        const highPriorityItems = [];
        
        inventory.forEach(item => {
            const usageRate = calculateUsageRate(usageHistory, item.id);
            
            // Only include high priority items (current stock <= min threshold)
            if (item.currentStock <= item.minThreshold) {
                const suggestedQuantity = Math.ceil(usageRate * 30); // 30 days supply
                
                highPriorityItems.push({
                    name: item.name,
                    itemId: item.id,
                    quantity: suggestedQuantity > 0 ? suggestedQuantity : item.minThreshold * 2
                });
            }
        });
        
        if (highPriorityItems.length === 0) {
            return res.json({
                success: false,
                message: 'No high priority items need restocking'
            });
        }
        
        // Create automated purchase order
        const newOrder = {
            id: generateId(),
            supplier: 'Automated Restock System',
            items: highPriorityItems,
            status: 'successful',
            automated: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Update inventory quantities for ordered items
        let updatedItems = 0;
        highPriorityItems.forEach(orderedItem => {
            const inventoryIndex = inventory.findIndex(item => item.id === orderedItem.itemId);
            
            if (inventoryIndex !== -1) {
                // Add the ordered quantity to current stock
                inventory[inventoryIndex].currentStock += parseInt(orderedItem.quantity) || 0;
                inventory[inventoryIndex].updatedAt = new Date().toISOString();
                updatedItems++;
                
                console.log(`Automated restock: ${inventory[inventoryIndex].name} - Added ${orderedItem.quantity} units, new stock: ${inventory[inventoryIndex].currentStock}`);
            }
        });
        
        // Save updated inventory
        await writeJsonFile(INVENTORY_FILE, inventory);
        
        // Save purchase order
        purchaseOrders.push(newOrder);
        await writeJsonFile(PURCHASE_ORDERS_FILE, purchaseOrders);

        console.log('Automated restock completed successfully:', newOrder.id);
        res.status(201).json({
            success: true,
            order: newOrder,
            itemsRestocked: updatedItems,
            totalQuantity: highPriorityItems.reduce((sum, item) => sum + item.quantity, 0)
        });
    } catch (error) {
        console.error('Failed to execute automated restock:', error);
        res.status(500).json({ error: 'Failed to execute automated restock' });
    }
});

// Create purchase order
app.post('/api/purchase-orders', async (req, res) => {
    try {
        const purchaseOrders = await readJsonFile(PURCHASE_ORDERS_FILE);
        const inventory = await readJsonFile(INVENTORY_FILE);
        
        const newOrder = {
            id: generateId(),
            ...req.body,
            status: 'successful',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Update inventory quantities for ordered items
        if (newOrder.items && Array.isArray(newOrder.items)) {
            let updatedItems = 0;
            
            newOrder.items.forEach(orderedItem => {
                const inventoryIndex = inventory.findIndex(item => item.id === orderedItem.itemId);
                
                if (inventoryIndex !== -1) {
                    // Add the ordered quantity to current stock
                    inventory[inventoryIndex].currentStock += parseInt(orderedItem.quantity) || 0;
                    inventory[inventoryIndex].updatedAt = new Date().toISOString();
                    updatedItems++;
                    
                    console.log(`Updated inventory: ${inventory[inventoryIndex].name} - Added ${orderedItem.quantity} units, new stock: ${inventory[inventoryIndex].currentStock}`);
                }
            });
            
            // Save updated inventory
            if (updatedItems > 0) {
                await writeJsonFile(INVENTORY_FILE, inventory);
                console.log(`Inventory updated for ${updatedItems} items from purchase order ${newOrder.id}`);
            }
        }
        
        purchaseOrders.push(newOrder);
        await writeJsonFile(PURCHASE_ORDERS_FILE, purchaseOrders);

        console.log('Purchase order created successfully:', newOrder.id);
        res.status(201).json(newOrder);
    } catch (error) {
        console.error('Failed to create purchase order:', error);
        res.status(500).json({ error: 'Failed to create purchase order' });
    }
});

// Get purchase orders
app.get('/api/purchase-orders', async (req, res) => {
    try {
        const purchaseOrders = await readJsonFile(PURCHASE_ORDERS_FILE);
        res.json(purchaseOrders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
});

// Get single purchase order
app.get('/api/purchase-orders/:id', async (req, res) => {
    try {
        const purchaseOrders = await readJsonFile(PURCHASE_ORDERS_FILE);
        const order = purchaseOrders.find(order => order.id === req.params.id);
        
        if (!order) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch purchase order' });
    }
});

// Update purchase order status
app.put('/api/purchase-orders/:id', async (req, res) => {
    try {
        const purchaseOrders = await readJsonFile(PURCHASE_ORDERS_FILE);
        const orderIndex = purchaseOrders.findIndex(order => order.id === req.params.id);
        
        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        
        purchaseOrders[orderIndex] = {
            ...purchaseOrders[orderIndex],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        await writeJsonFile(PURCHASE_ORDERS_FILE, purchaseOrders);
        res.json(purchaseOrders[orderIndex]);
    } catch (error) {
        console.error('Failed to update purchase order:', error);
        res.status(500).json({ error: 'Failed to update purchase order' });
    }
});

// Simulate barcode scanning
app.post('/api/scan-barcode', async (req, res) => {
    try {
        const { barcode } = req.body;
        const inventory = await readJsonFile(INVENTORY_FILE);
        
        const item = inventory.find(item => item.barcode === barcode);
        
        if (item) {
            res.json({ success: true, item });
        } else {
            res.json({ success: false, message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to process barcode' });
    }
});

// Get usage history
app.get('/api/usage-history', async (req, res) => {
    try {
        const usageHistory = await readJsonFile(USAGE_FILE);
        const inventory = await readJsonFile(INVENTORY_FILE);
        
        // Enrich usage history with item names
        const enrichedHistory = usageHistory.map(usage => {
            const item = inventory.find(item => item.id === usage.itemId);
            return {
                ...usage,
                itemName: item ? item.name : 'Unknown Item'
            };
        });
        
        res.json(enrichedHistory);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch usage history' });
    }
});

// Chatbot endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, context } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get current data from JSON files
        const inventory = await readJsonFile(INVENTORY_FILE);
        const usageHistory = await readJsonFile(USAGE_FILE);
        const purchaseOrders = await readJsonFile(PURCHASE_ORDERS_FILE);

        // Enrich usage history with item names
        const enrichedUsageHistory = usageHistory.map(usage => {
            const item = inventory.find(item => item.id === usage.itemId);
            return {
                ...usage,
                itemName: item ? item.name : 'Unknown Item',
                category: item ? item.category : 'Unknown'
            };
        });

        // Calculate current alerts
        const alerts = [];
        inventory.forEach(item => {
            // Low stock alert
            if (item.currentStock <= item.minThreshold) {
                alerts.push({
                    type: 'low_stock',
                    severity: item.currentStock === 0 ? 'critical' : 'warning',
                    item: item.name,
                    currentStock: item.currentStock,
                    minThreshold: item.minThreshold,
                    category: item.category
                });
            }
            
            // Expiration alert
            if (item.expirationDate) {
                const daysToExpiry = Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
                if (daysToExpiry <= 7 && daysToExpiry >= 0) {
                    alerts.push({
                        type: 'expiring',
                        severity: daysToExpiry <= 3 ? 'critical' : 'warning',
                        item: item.name,
                        daysToExpiry: daysToExpiry,
                        expirationDate: item.expirationDate,
                        category: item.category
                    });
                }
            }
        });

        // Get the generative model
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Create a comprehensive system prompt with actual data
        const systemPrompt = `You are an AI assistant for healthcare inventory management. Provide **CONCISE, DIRECT** answers.

## **CURRENT INVENTORY DATA:**
${JSON.stringify(inventory, null, 2)}

## **RECENT USAGE HISTORY (Last 10):**
${JSON.stringify(enrichedUsageHistory.slice(-10), null, 2)}

## **CURRENT ALERTS:**
${JSON.stringify(alerts, null, 2)}

## **PURCHASE ORDERS:**
${JSON.stringify(purchaseOrders, null, 2)}

## **INVENTORY SUMMARY:**
• **Total Items:** ${inventory.length}
• **Low Stock Items:** ${inventory.filter(item => item.currentStock <= item.minThreshold).length}
• **Out of Stock Items:** ${inventory.filter(item => item.currentStock === 0).length}
• **Expiring Soon:** ${alerts.filter(alert => alert.type === 'expiring').length}

## **CRITICAL ALERTS:**
${alerts.length > 0 ? alerts.map(alert => 
    `• **${alert.item}** (${alert.category}): ${alert.type === 'low_stock' ? 
        `${alert.currentStock}/${alert.minThreshold} units` : 
        `expires in ${alert.daysToExpiry} days`}`
).join('\n') : '• No critical alerts'}

## **RESPONSE GUIDELINES:**
• Keep answers **SHORT and ACTIONABLE** (2-3 sentences max)
• Use **bullet points** for multiple items
• **Bold** important numbers, item names, and actions
• Reference **specific items, quantities, suppliers** from the data
• Focus on **immediate actions needed**
• Skip lengthy explanations unless asked for details
• Use professional medical terminology but be **direct**

**User question:** ${message}`;

        // Generate response
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const botReply = response.text();

        res.json({ 
            reply: botReply,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ 
            error: 'Failed to process chat message',
            reply: 'I apologize, but I\'m experiencing technical difficulties. Please try again later.'
        });
    }
});

// Serve authentication page
app.get('/auth.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

// Root route - serve main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize data files and start server
initializeDataFiles().then(() => {
    app.listen(PORT, () => {
        console.log(`🏥 Clinic Inventory Management System running on http://localhost:${PORT}`);
        console.log('📊 Backend API ready for inventory management');
        console.log('🔐 Authentication system enabled');
    });
}).catch(error => {
    console.error('Failed to initialize data files:', error);
});
