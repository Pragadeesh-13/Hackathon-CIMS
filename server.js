const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data file paths
const INVENTORY_FILE = path.join(__dirname, 'data', 'inventory.json');
const USAGE_FILE = path.join(__dirname, 'data', 'usage_history.json');
const PURCHASE_ORDERS_FILE = path.join(__dirname, 'data', 'purchase_orders.json');

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
                const daysUntilEmpty = usageRate > 0 ? item.currentStock / usageRate : Infinity;
                const suggestedQuantity = Math.ceil(usageRate * 30); // 30 days supply
                
                suggestions.push({
                    itemId: item.id,
                    itemName: item.name,
                    currentStock: item.currentStock,
                    usageRate: Math.round(usageRate * 100) / 100,
                    daysUntilEmpty: Math.round(daysUntilEmpty),
                    suggestedQuantity: suggestedQuantity > 0 ? suggestedQuantity : item.minThreshold * 2,
                    priority: item.currentStock <= item.minThreshold ? 'high' : 'medium'
                });
            }
        });
        
        // Sort by priority and days until empty
        suggestions.sort((a, b) => {
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (b.priority === 'high' && a.priority !== 'high') return 1;
            return a.daysUntilEmpty - b.daysUntilEmpty;
        });
        
        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate restock suggestions' });
    }
});

// Create purchase order
app.post('/api/purchase-orders', async (req, res) => {
    try {
        const purchaseOrders = await readJsonFile(PURCHASE_ORDERS_FILE);
        const newOrder = {
            id: generateId(),
            ...req.body,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        purchaseOrders.push(newOrder);
        await writeJsonFile(PURCHASE_ORDERS_FILE, purchaseOrders);
        res.status(201).json(newOrder);
    } catch (error) {
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

// Initialize data files and start server
initializeDataFiles().then(() => {
    app.listen(PORT, () => {
        console.log(`🏥 Clinic Inventory Management System running on http://localhost:${PORT}`);
        console.log('📊 Backend API ready for inventory management');
    });
}).catch(error => {
    console.error('Failed to initialize data files:', error);
});
