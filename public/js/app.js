// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Global state
let inventory = [];
let alerts = [];
let usageHistory = [];
let restockSuggestions = [];
let purchaseOrders = [];

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const addItemModal = document.getElementById('addItemModal');
const addItemForm = document.getElementById('addItemForm');
const usageForm = document.getElementById('usageForm');
const loading = document.getElementById('loading');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// Initialize the application
async function initializeApp() {
    try {
        showLoading();
        await Promise.all([
            loadInventory(),
            loadAlerts(),
            loadUsageHistory(),
            loadRestockSuggestions(),
            loadPurchaseOrders()
        ]);
        updateDashboard();
        hideLoading();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showToast('Failed to load data', 'error');
        hideLoading();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Tab navigation
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Add item form
    addItemForm.addEventListener('submit', handleAddItem);
    
    // Usage form
    usageForm.addEventListener('submit', handleRecordUsage);

    // Search functionality
    const searchInput = document.getElementById('searchInventory');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Barcode scanner
    const barcodeInput = document.getElementById('barcodeInput');
    if (barcodeInput) {
        barcodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                scanBarcode();
            }
        });
    }

    // Alerts indicator
    const alertsIndicator = document.getElementById('alertsIndicator');
    if (alertsIndicator) {
        alertsIndicator.addEventListener('click', () => switchTab('alerts'));
    }
}

// API Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Data loading functions
async function loadInventory() {
    inventory = await apiCall('/inventory');
    renderInventoryTable();
    populateUsageItemSelect();
}

async function loadAlerts() {
    alerts = await apiCall('/alerts');
    renderAlerts();
    updateAlertsIndicator();
}

async function loadUsageHistory() {
    usageHistory = await apiCall('/usage-history');
    renderUsageHistory();
}

async function loadRestockSuggestions() {
    restockSuggestions = await apiCall('/restock-suggestions');
    renderRestockSuggestions();
}

async function loadPurchaseOrders() {
    purchaseOrders = await apiCall('/purchase-orders');
    renderPurchaseOrders();
}

// Tab switching
function switchTab(tabId) {
    // Update tab buttons
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // Update tab contents
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });

    // Refresh data based on active tab
    switch(tabId) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'alerts':
            loadAlerts();
            break;
        case 'restock':
            loadRestockSuggestions();
            loadPurchaseOrders();
            break;
        case 'usage':
            loadUsageHistory();
            break;
    }
}

// Dashboard updates
function updateDashboard() {
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(item => item.currentStock <= item.minThreshold).length;
    const expiringItems = inventory.filter(item => {
        if (!item.expirationDate) return false;
        const daysUntilExpiry = Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 7;
    }).length;

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('lowStockCount').textContent = lowStockItems;
    document.getElementById('expiringCount').textContent = expiringItems;
    document.getElementById('purchaseOrderCount').textContent = purchaseOrders.length;

    renderRecentAlerts();
}

// Render functions
function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    if (inventory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No inventory items found</td></tr>';
        return;
    }

    tbody.innerHTML = inventory.map(item => {
        const status = getItemStatus(item);
        return `
            <tr>
                <td>
                    <strong>${item.name}</strong>
                    ${item.description ? `<br><small class="text-muted">${item.description}</small>` : ''}
                </td>
                <td>${item.category}</td>
                <td>${item.currentStock}</td>
                <td>${item.minThreshold}</td>
                <td>${item.expirationDate ? formatDate(item.expirationDate) : 'N/A'}</td>
                <td><span class="status-badge ${status.class}">${status.text}</span></td>
                <td>
                    <button class="action-btn" onclick="editItem('${item.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteItem('${item.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderAlerts() {
    const container = document.getElementById('alertsContainer');
    if (!container) return;

    if (alerts.length === 0) {
        container.innerHTML = '<p class="no-data">No alerts at the moment</p>';
        return;
    }

    container.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.severity}">
            <div class="alert-header">
                <i class="fas ${getAlertIcon(alert.type)} alert-icon ${alert.severity}"></i>
                <strong>${alert.item}</strong>
            </div>
            <p class="alert-message">${alert.message}</p>
        </div>
    `).join('');
}

function renderRecentAlerts() {
    const container = document.getElementById('recentAlerts');
    if (!container) return;

    const recentAlerts = alerts.slice(0, 5);

    if (recentAlerts.length === 0) {
        container.innerHTML = '<p class="no-data">No alerts at the moment</p>';
        return;
    }

    container.innerHTML = recentAlerts.map(alert => `
        <div class="alert-item ${alert.severity}">
            <div class="alert-header">
                <i class="fas ${getAlertIcon(alert.type)} alert-icon ${alert.severity}"></i>
                <strong>${alert.item}</strong>
            </div>
            <p class="alert-message">${alert.message}</p>
        </div>
    `).join('');
}

function renderUsageHistory() {
    const container = document.getElementById('usageHistory');
    if (!container) return;

    if (usageHistory.length === 0) {
        container.innerHTML = '<p class="no-data">No usage history found</p>';
        return;
    }

    const sortedHistory = usageHistory.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sortedHistory.map(usage => `
        <div class="usage-item">
            <div class="usage-item-header">
                <span class="usage-item-name">${usage.itemName}</span>
                <span class="usage-item-date">${formatDate(usage.date)}</span>
            </div>
            <div class="usage-item-details">
                <span><strong>Quantity:</strong> ${usage.quantity}</span>
                ${usage.notes ? `<span><strong>Notes:</strong> ${usage.notes}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function renderRestockSuggestions() {
    const container = document.getElementById('restockSuggestions');
    if (!container) return;

    if (restockSuggestions.length === 0) {
        container.innerHTML = '<p class="no-data">No restock suggestions at the moment</p>';
        return;
    }

    container.innerHTML = restockSuggestions.map(suggestion => `
        <div class="restock-item ${suggestion.priority}">
            <div class="restock-header">
                <span class="restock-title">${suggestion.itemName}</span>
                <span class="priority-badge priority-${suggestion.priority}">${suggestion.priority.toUpperCase()}</span>
            </div>
            <div class="restock-details">
                <div><strong>Current Stock:</strong> ${suggestion.currentStock}</div>
                <div><strong>Usage Rate:</strong> ${suggestion.usageRate}/day</div>
                <div><strong>Days Until Empty:</strong> ${suggestion.daysUntilEmpty === Infinity ? 'N/A' : suggestion.daysUntilEmpty}</div>
                <div><strong>Suggested Quantity:</strong> ${suggestion.suggestedQuantity}</div>
            </div>
        </div>
    `).join('');
}

function renderPurchaseOrders() {
    const container = document.getElementById('purchaseOrdersContainer');
    if (!container) return;

    if (purchaseOrders.length === 0) {
        container.innerHTML = '<p class="no-data">No purchase orders found</p>';
        return;
    }

    container.innerHTML = purchaseOrders.map(order => `
        <div class="purchase-order">
            <div class="order-header">
                <span class="order-id">Order #${order.id}</span>
                <span class="order-status">${order.status}</span>
            </div>
            <div><strong>Supplier:</strong> ${order.supplier || 'N/A'}</div>
            <div><strong>Date:</strong> ${formatDate(order.createdAt)}</div>
            <div><strong>Total Items:</strong> ${order.items ? order.items.length : 0}</div>
            ${order.items ? `
                <div class="order-items">
                    <strong>Items:</strong>
                    ${order.items.map(item => `
                        <div class="order-item">
                            <span>${item.name}</span>
                            <span>Qty: ${item.quantity}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Utility functions
function getItemStatus(item) {
    if (item.expirationDate) {
        const daysUntilExpiry = Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 0) {
            return { class: 'status-expired', text: 'Expired' };
        }
        if (daysUntilExpiry <= 3) {
            return { class: 'status-critical', text: 'Expires Soon' };
        }
    }

    if (item.currentStock === 0) {
        return { class: 'status-critical', text: 'Out of Stock' };
    }
    if (item.currentStock <= item.minThreshold) {
        return { class: 'status-low', text: 'Low Stock' };
    }
    return { class: 'status-good', text: 'Good' };
}

function getAlertIcon(type) {
    switch(type) {
        case 'low_stock': return 'fa-boxes';
        case 'expiring': return 'fa-clock';
        default: return 'fa-exclamation-triangle';
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

// Modal functions
function showAddItemModal() {
    document.getElementById('modalTitle').textContent = 'Add New Item';
    document.getElementById('submitButtonText').textContent = 'Add Item';
    document.getElementById('editItemId').value = '';
    addItemForm.reset();
    addItemModal.style.display = 'block';
}

function closeAddItemModal() {
    addItemModal.style.display = 'none';
}

// Event handlers
async function handleAddItem(e) {
    e.preventDefault();
    
    try {
        showLoading();

        const itemData = {
            name: document.getElementById('itemName').value,
            category: document.getElementById('itemCategory').value,
            barcode: document.getElementById('itemBarcode').value,
            currentStock: parseInt(document.getElementById('currentStock').value),
            minThreshold: parseInt(document.getElementById('minThreshold').value),
            unitPrice: parseFloat(document.getElementById('unitPrice').value) || 0,
            supplier: document.getElementById('supplier').value,
            expirationDate: document.getElementById('expirationDate').value || null,
            description: document.getElementById('description').value
        };

        const editItemId = document.getElementById('editItemId').value;

        if (editItemId) {
            // Update existing item
            await apiCall(`/inventory/${editItemId}`, {
                method: 'PUT',
                body: JSON.stringify(itemData)
            });
            showToast('Item updated successfully', 'success');
        } else {
            // Add new item
            await apiCall('/inventory', {
                method: 'POST',
                body: JSON.stringify(itemData)
            });
            showToast('Item added successfully', 'success');
        }

        closeAddItemModal();
        await loadInventory();
        await loadAlerts();
        updateDashboard();
        hideLoading();
    } catch (error) {
        console.error('Failed to save item:', error);
        showToast('Failed to save item', 'error');
        hideLoading();
    }
}

async function handleRecordUsage(e) {
    e.preventDefault();

    try {
        showLoading();

        const usageData = {
            itemId: document.getElementById('usageItemSelect').value,
            quantity: parseInt(document.getElementById('usageQuantity').value),
            notes: document.getElementById('usageNotes').value
        };

        await apiCall('/usage', {
            method: 'POST',
            body: JSON.stringify(usageData)
        });

        showToast('Usage recorded successfully', 'success');
        usageForm.reset();
        
        await Promise.all([
            loadInventory(),
            loadUsageHistory(),
            loadAlerts()
        ]);
        updateDashboard();
        hideLoading();
    } catch (error) {
        console.error('Failed to record usage:', error);
        showToast('Failed to record usage', 'error');
        hideLoading();
    }
}

// Item management
async function editItem(itemId) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('modalTitle').textContent = 'Edit Item';
    document.getElementById('submitButtonText').textContent = 'Update Item';
    document.getElementById('editItemId').value = itemId;
    
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemBarcode').value = item.barcode || '';
    document.getElementById('currentStock').value = item.currentStock;
    document.getElementById('minThreshold').value = item.minThreshold;
    document.getElementById('unitPrice').value = item.unitPrice || '';
    document.getElementById('supplier').value = item.supplier || '';
    document.getElementById('expirationDate').value = item.expirationDate || '';
    document.getElementById('description').value = item.description || '';

    addItemModal.style.display = 'block';
}

async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        showLoading();

        await apiCall(`/inventory/${itemId}`, {
            method: 'DELETE'
        });

        showToast('Item deleted successfully', 'success');
        
        await Promise.all([
            loadInventory(),
            loadAlerts()
        ]);
        updateDashboard();
        hideLoading();
    } catch (error) {
        console.error('Failed to delete item:', error);
        showToast('Failed to delete item', 'error');
        hideLoading();
    }
}

// Search functionality
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredInventory = inventory.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        (item.description && item.description.toLowerCase().includes(searchTerm))
    );

    renderFilteredInventory(filteredInventory);
}

function renderFilteredInventory(filteredInventory) {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    if (filteredInventory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No matching items found</td></tr>';
        return;
    }

    tbody.innerHTML = filteredInventory.map(item => {
        const status = getItemStatus(item);
        return `
            <tr>
                <td>
                    <strong>${item.name}</strong>
                    ${item.description ? `<br><small class="text-muted">${item.description}</small>` : ''}
                </td>
                <td>${item.category}</td>
                <td>${item.currentStock}</td>
                <td>${item.minThreshold}</td>
                <td>${item.expirationDate ? formatDate(item.expirationDate) : 'N/A'}</td>
                <td><span class="status-badge ${status.class}">${status.text}</span></td>
                <td>
                    <button class="action-btn" onclick="editItem('${item.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteItem('${item.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Barcode scanning
async function scanBarcode() {
    const barcode = document.getElementById('barcodeInput').value.trim();
    const resultContainer = document.getElementById('scanResult');

    if (!barcode) {
        resultContainer.innerHTML = '<p>Please enter a barcode</p>';
        resultContainer.className = 'scan-result error';
        return;
    }

    try {
        const result = await apiCall('/scan-barcode', {
            method: 'POST',
            body: JSON.stringify({ barcode })
        });

        if (result.success) {
            const item = result.item;
            const status = getItemStatus(item);
            
            resultContainer.innerHTML = `
                <div>
                    <h3>${item.name}</h3>
                    <p><strong>Category:</strong> ${item.category}</p>
                    <p><strong>Current Stock:</strong> ${item.currentStock}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${status.class}">${status.text}</span></p>
                    ${item.expirationDate ? `<p><strong>Expires:</strong> ${formatDate(item.expirationDate)}</p>` : ''}
                    <div style="margin-top: 1rem;">
                        <button class="btn btn-primary" onclick="editItem('${item.id}')">Edit Item</button>
                        <button class="btn btn-secondary" onclick="quickUsage('${item.id}')">Record Usage</button>
                    </div>
                </div>
            `;
            resultContainer.className = 'scan-result success';
        } else {
            resultContainer.innerHTML = `<p>${result.message}</p>`;
            resultContainer.className = 'scan-result error';
        }
    } catch (error) {
        console.error('Failed to scan barcode:', error);
        resultContainer.innerHTML = '<p>Failed to scan barcode</p>';
        resultContainer.className = 'scan-result error';
    }
}

function quickUsage(itemId) {
    switchTab('usage');
    document.getElementById('usageItemSelect').value = itemId;
}

// Restock functions
async function generatePurchaseOrder() {
    if (restockSuggestions.length === 0) {
        showToast('No restock suggestions available', 'warning');
        return;
    }

    try {
        showLoading();

        const orderData = {
            supplier: 'Default Supplier',
            items: restockSuggestions.filter(s => s.priority === 'high').map(s => ({
                name: s.itemName,
                quantity: s.suggestedQuantity,
                itemId: s.itemId
            }))
        };

        if (orderData.items.length === 0) {
            showToast('No high priority items to order', 'info');
            hideLoading();
            return;
        }

        await apiCall('/purchase-orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });

        showToast('Purchase order created successfully', 'success');
        await loadPurchaseOrders();
        hideLoading();
    } catch (error) {
        console.error('Failed to create purchase order:', error);
        showToast('Failed to create purchase order', 'error');
        hideLoading();
    }
}

// Utility functions
function populateUsageItemSelect() {
    const select = document.getElementById('usageItemSelect');
    if (!select) return;

    select.innerHTML = '<option value="">Select an item...</option>' +
        inventory.map(item => `<option value="${item.id}">${item.name} (Stock: ${item.currentStock})</option>`).join('');
}

function updateAlertsIndicator() {
    const alertCount = document.getElementById('alertCount');
    if (alertCount) {
        alertCount.textContent = alerts.length;
        alertCount.style.display = alerts.length > 0 ? 'flex' : 'none';
    }
}

async function refreshAlerts() {
    try {
        showLoading();
        await loadAlerts();
        updateDashboard();
        hideLoading();
        showToast('Alerts refreshed', 'success');
    } catch (error) {
        console.error('Failed to refresh alerts:', error);
        showToast('Failed to refresh alerts', 'error');
        hideLoading();
    }
}

// UI utility functions
function showLoading() {
    loading.style.display = 'flex';
}

function hideLoading() {
    loading.style.display = 'none';
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    }[type] || 'fa-info-circle';

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target === addItemModal) {
        closeAddItemModal();
    }
};

// Global functions for HTML onclick events
window.showAddItemModal = showAddItemModal;
window.closeAddItemModal = closeAddItemModal;
window.editItem = editItem;
window.deleteItem = deleteItem;
window.scanBarcode = scanBarcode;
window.quickUsage = quickUsage;
window.switchTab = switchTab;
window.generatePurchaseOrder = generatePurchaseOrder;
window.refreshAlerts = refreshAlerts;
