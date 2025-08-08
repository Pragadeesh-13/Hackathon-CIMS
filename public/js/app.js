// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Authentication state
let currentUser = null;
let authToken = localStorage.getItem('authToken');

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
const chatForm = document.getElementById('chatForm');
const loading = document.getElementById('loading');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
});

// Authentication functions
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        redirectToAuth();
        return;
    }
    
    try {
        currentUser = JSON.parse(userData);
        
        // Check if user role is allowed
        if (!['pharmacist', 'admin'].includes(currentUser.role)) {
            localStorage.clear();
            redirectToAuth();
            return;
        }
        
        updateHeaderWithUser();
        initializeApp();
        setupEventListeners();
    } catch (error) {
        console.error('Authentication error:', error);
        redirectToAuth();
    }
}

function redirectToAuth() {
    window.location.href = '/auth.html';
}

function updateHeaderWithUser() {
    const headerActions = document.querySelector('.header-actions');
    
    // Check if user profile already exists to prevent duplicates
    const existingProfile = headerActions.querySelector('.user-profile');
    if (existingProfile) {
        return; // Profile already exists, don't create another
    }
    
    const userProfile = document.createElement('div');
    userProfile.className = 'user-profile';
    
    userProfile.innerHTML = `
        <div class="user-info" onclick="toggleUserMenu()">
            <div class="user-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="user-details">
                <div class="user-name">${currentUser.firstName} ${currentUser.lastName}</div>
                <div class="user-role">${currentUser.role}</div>
            </div>
            <i class="fas fa-chevron-down"></i>
        </div>
        <div class="user-menu" id="userMenu">
            <div class="user-menu-header">
                <strong>${currentUser.firstName} ${currentUser.lastName}</strong>
                <small>${currentUser.email}</small>
            </div>
            <hr>
            <button class="user-menu-item" onclick="viewProfile()">
                <i class="fas fa-user"></i> View Profile
            </button>
            <button class="user-menu-item" onclick="changePassword()">
                <i class="fas fa-key"></i> Change Password
            </button>
            <hr>
            <button class="user-menu-item logout" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        </div>
    `;
    
    headerActions.appendChild(userProfile);
}

function toggleUserMenu() {
    const userMenu = document.getElementById('userMenu');
    userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
}

function viewProfile() {
    showToast('Profile management coming soon!', 'info');
    toggleUserMenu();
}

function changePassword() {
    showToast('Password change coming soon!', 'info');
    toggleUserMenu();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        redirectToAuth();
    }
}

// Close user menu when clicking outside
document.addEventListener('click', function(e) {
    const userProfile = document.querySelector('.user-profile');
    const userMenu = document.getElementById('userMenu');
    
    if (userProfile && userMenu && !userProfile.contains(e.target)) {
        userMenu.style.display = 'none';
    }
});

// Initialize the application
async function initializeApp() {
    try {
        showLoading();
        
        // Load data with individual error handling
        const results = await Promise.allSettled([
            loadInventory(),
            loadAlerts(),
            loadUsageHistory(),
            loadRestockSuggestions(),
            loadPurchaseOrders()
        ]);
        
        // Check for any failures
        const failures = results.filter(result => result.status === 'rejected');
        
        if (failures.length > 0) {
            console.error('Some data failed to load:', failures);
            failures.forEach((failure, index) => {
                const endpoints = ['inventory', 'alerts', 'usage-history', 'restock-suggestions', 'purchase-orders'];
                console.error(`Failed to load ${endpoints[index]}:`, failure.reason);
            });
            showToast(`Failed to load ${failures.length} data source(s). Check console for details.`, 'warning');
        }
        
        // Only update dashboard if there were no critical failures
        if (failures.length < results.length) {
            updateDashboard();
        }
        
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

    // Chat form
    if (chatForm) {
        chatForm.addEventListener('submit', handleChatMessage);
    }

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
        console.log(`🔄 Making API call to: ${API_BASE_URL}${endpoint}`);
        
        // Add authentication headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers,
            ...options
        });

        if (!response.ok) {
            // Handle authentication errors
            if (response.status === 401) {
                localStorage.clear();
                redirectToAuth();
                return;
            }
            
            const errorText = await response.text();
            console.error(`❌ API Error ${response.status}: ${response.statusText}`, errorText);
            throw new Error(`API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`✅ API call successful: ${endpoint}`, data.length ? `(${data.length} items)` : '');
        return data;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('❌ Network error - is the server running?', error);
            throw new Error('Network error: Unable to connect to server. Please ensure the server is running on http://localhost:3000');
        }
        console.error(`❌ API call failed for ${endpoint}:`, error);
        throw error;
    }
}

// Data loading functions
async function loadInventory() {
    try {
        inventory = await apiCall('/inventory');
        renderInventoryTable();
        populateUsageItemSelect();
        console.log('✅ Inventory loaded successfully');
    } catch (error) {
        console.error('❌ Failed to load inventory:', error);
        inventory = []; // Fallback to empty array
        throw error;
    }
}

async function loadAlerts() {
    try {
        alerts = await apiCall('/alerts');
        renderAlerts();
        renderRecentAlerts();
        updateAlertsIndicator();
        console.log('✅ Alerts loaded successfully');
    } catch (error) {
        console.error('❌ Failed to load alerts:', error);
        alerts = []; // Fallback to empty array
        throw error;
    }
}

async function loadUsageHistory() {
    try {
        usageHistory = await apiCall('/usage-history');
        renderUsageHistory();
        console.log('✅ Usage history loaded successfully');
    } catch (error) {
        console.error('❌ Failed to load usage history:', error);
        usageHistory = []; // Fallback to empty array
        throw error;
    }
}

async function loadRestockSuggestions() {
    try {
        restockSuggestions = await apiCall('/restock-suggestions');
        renderRestockSuggestions();
        console.log('✅ Restock suggestions loaded successfully');
    } catch (error) {
        console.error('❌ Failed to load restock suggestions:', error);
        restockSuggestions = []; // Fallback to empty array
        throw error;
    }
}

async function loadPurchaseOrders() {
    try {
        purchaseOrders = await apiCall('/purchase-orders');
        renderPurchaseOrders();
        console.log('✅ Purchase orders loaded successfully');
    } catch (error) {
        console.error('❌ Failed to load purchase orders:', error);
        purchaseOrders = []; // Fallback to empty array
        throw error;
    }
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
    const expiredItems = inventory.filter(item => 
        item.expirationDate && new Date(item.expirationDate) < new Date()
    ).length;
    const successfulOrders = purchaseOrders.filter(order => order.status === 'successful').length;

    // Check if elements exist before updating
    const totalItemsEl = document.getElementById('totalItems');
    const lowStockCountEl = document.getElementById('lowStockCount');
    const expiringCountEl = document.getElementById('expiringCount');
    const purchaseOrderCountEl = document.getElementById('purchaseOrderCount');

    if (totalItemsEl) totalItemsEl.textContent = totalItems;
    if (lowStockCountEl) lowStockCountEl.textContent = lowStockItems;
    if (expiringCountEl) expiringCountEl.textContent = expiredItems;
    if (purchaseOrderCountEl) purchaseOrderCountEl.textContent = successfulOrders;

    updateAlertsIndicator();
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
                <div><strong>Selling Rate:</strong> ${suggestion.usageRate}/day</div>
                <div><strong>Days Until Empty:</strong> ${suggestion.daysUntilEmpty === null ? 'N/A' : suggestion.daysUntilEmpty}</div>
                <div><strong>Suggested Quantity:</strong> ${suggestion.suggestedQuantity}</div>
            </div>
            <div class="restock-actions">
                <button class="btn btn-primary btn-sm" onclick="createSingleItemOrder('${suggestion.itemId}', '${suggestion.itemName}', ${suggestion.suggestedQuantity})">
                    <i class="fas fa-shopping-cart"></i> Order This Item
                </button>
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
                <span class="order-status status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
            </div>
            <div><strong>Supplier:</strong> ${order.supplier || 'N/A'}</div>
            <div><strong>Date:</strong> ${formatDate(order.createdAt)}</div>
            <div><strong>Total Items:</strong> ${order.items ? order.items.length : 0}</div>
            ${order.updatedAt && order.updatedAt !== order.createdAt ? 
                `<div><strong>Last Updated:</strong> ${formatDate(order.updatedAt)}</div>` : ''
            }
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

    // Show modal for item selection
    showPurchaseOrderModal();
}

function showPurchaseOrderModal() {
    // Create modal HTML if it doesn't exist
    let modal = document.getElementById('purchaseOrderModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'purchaseOrderModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Create Purchase Order</h2>
                    <span class="close" onclick="closePurchaseOrderModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="supplierName">Supplier Name:</label>
                        <input type="text" id="supplierName" placeholder="Enter supplier name" value="Default Supplier">
                    </div>
                    <div class="form-group">
                        <label>Select Items to Order:</label>
                        <div id="purchaseOrderItems" class="purchase-order-items">
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="closePurchaseOrderModal()">Cancel</button>
                        <button class="btn btn-success" onclick="createPurchaseOrderFromModal()">Create Order</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Populate items
    const itemsContainer = modal.querySelector('#purchaseOrderItems');
    itemsContainer.innerHTML = restockSuggestions.map(suggestion => `
        <div class="purchase-item-row">
            <input type="checkbox" id="item_${suggestion.itemId}" value="${suggestion.itemId}" 
                   ${suggestion.priority === 'high' ? 'checked' : ''}>
            <label for="item_${suggestion.itemId}" class="item-label">
                <span class="item-name">${suggestion.itemName}</span>
                <span class="item-priority priority-${suggestion.priority}">${suggestion.priority.toUpperCase()}</span>
            </label>
            <input type="number" class="quantity-input" id="qty_${suggestion.itemId}" 
                   value="${suggestion.suggestedQuantity}" min="1" placeholder="Quantity">
        </div>
    `).join('');

    modal.style.display = 'block';
}

function closePurchaseOrderModal() {
    const modal = document.getElementById('purchaseOrderModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function createPurchaseOrderFromModal() {
    const supplierName = document.getElementById('supplierName').value.trim();
    
    if (!supplierName) {
        showToast('Please enter a supplier name', 'warning');
        return;
    }

    const selectedItems = [];
    const checkboxes = document.querySelectorAll('#purchaseOrderItems input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
        const itemId = checkbox.value;
        const quantityInput = document.getElementById(`qty_${itemId}`);
        const quantity = parseInt(quantityInput.value) || 0;
        
        if (quantity > 0) {
            const suggestion = restockSuggestions.find(s => s.itemId === itemId);
            if (suggestion) {
                selectedItems.push({
                    name: suggestion.itemName,
                    quantity: quantity,
                    itemId: itemId
                });
            }
        }
    });

    if (selectedItems.length === 0) {
        showToast('Please select at least one item with quantity > 0', 'warning');
        return;
    }

    try {
        showLoading();

        const orderData = {
            supplier: supplierName,
            items: selectedItems
        };

        await apiCall('/purchase-orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });

        const successMessage = orderData.items.length === 1 
            ? `✅ Purchase order placed successfully for ${orderData.items[0].name} (${orderData.items[0].quantity} units)! Inventory updated.`
            : `✅ Purchase order placed successfully for ${orderData.items.length} items! Inventory updated.`;

        showToast(successMessage, 'success');
        
        // Refresh all relevant data after successful order
        await Promise.all([
            loadInventory(),
            loadPurchaseOrders(),
            loadRestockSuggestions(),
            loadAlerts()
        ]);
        
        closePurchaseOrderModal();
        hideLoading();
    } catch (error) {
        console.error('Failed to create purchase order:', error);
        showToast('Failed to create purchase order', 'error');
        hideLoading();
    }
}

async function createSingleItemOrder(itemId, itemName, suggestedQuantity) {
    const confirmation = confirm(`Create purchase order for ${itemName} (${suggestedQuantity} units)?`);
    if (!confirmation) return;

    try {
        showLoading();

        const orderData = {
            supplier: 'Default Supplier',
            items: [{
                name: itemName,
                quantity: suggestedQuantity,
                itemId: itemId
            }]
        };

        await apiCall('/purchase-orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });

        showToast(`✅ Purchase order placed successfully for ${itemName} (${suggestedQuantity} units)! Inventory updated.`, 'success');
        
        // Refresh all relevant data after successful order
        await Promise.all([
            loadInventory(),
            loadPurchaseOrders(),
            loadRestockSuggestions(),
            loadAlerts()
        ]);
        
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



// Helper function to convert markdown to HTML
function formatMarkdownToHTML(text) {
    let html = text
        // Convert **bold** to <strong>
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert *italic* (but not bullet points) to <em>
        .replace(/(?<!^|\n)\*(.*?)\*/g, '<em>$1</em>')
        // Convert ## headers to h4
        .replace(/^## (.*$)/gim, '<h4>$1</h4>')
        // Convert ### headers to h5
        .replace(/^### (.*$)/gim, '<h5>$1</h5>')
        // Convert line breaks to <br>
        .replace(/\n/g, '<br>');
    
    // Handle bullet points - convert * items to <li> and wrap in <ul>
    html = html.replace(/(?:^|\<br\>)\* (.+?)(?=\<br\>(?!\* )|$)/g, function(match, content) {
        return '<li>' + content + '</li>';
    });
    
    // Wrap consecutive <li> items in <ul>
    html = html.replace(/(<li>.*?<\/li>)(\<br\><li>.*?<\/li>)*/g, function(match) {
        const items = match.replace(/\<br\>/g, '');
        return '<ul>' + items + '</ul>';
    });
    
    return html;
}

// Generate restock chart with AI insights
let restockChart = null; // Global variable to store chart instance

async function generateRestockChart() {
    try {
        showLoading();
        
        const response = await apiCall('/restock-chart');
        const chartContainer = document.getElementById('restockChartContainer');
        const canvas = document.getElementById('restockChart');
        const insightsText = document.getElementById('aiInsightsText');
        
        // Show chart container
        chartContainer.style.display = 'block';
        
        // Destroy existing chart if it exists
        if (restockChart) {
            restockChart.destroy();
        }
        
        // Create new chart
        const ctx = canvas.getContext('2d');
        restockChart = new Chart(ctx, {
            type: 'bar',
            data: response.chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Restock Analysis: Current Stock vs Suggested Quantity',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantity'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Items'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
        
        // Update AI insights with markdown formatting
        insightsText.innerHTML = formatMarkdownToHTML(response.aiInsights);
        
        hideLoading();
        showToast('Restock chart generated successfully!', 'success');
        
    } catch (error) {
        console.error('Failed to generate restock chart:', error);
        hideLoading();
        showToast('Failed to generate restock chart', 'error');
    }
}

// Global functions for HTML onclick events
window.showAddItemModal = showAddItemModal;
window.closeAddItemModal = closeAddItemModal;
window.editItem = editItem;
window.deleteItem = deleteItem;
window.scanBarcode = scanBarcode;
window.quickUsage = quickUsage;
window.switchTab = switchTab;
window.generatePurchaseOrder = generatePurchaseOrder;
window.createSingleItemOrder = createSingleItemOrder;
window.closePurchaseOrderModal = closePurchaseOrderModal;
window.createPurchaseOrderFromModal = createPurchaseOrderFromModal;
window.refreshAlerts = refreshAlerts;
window.clearChat = clearChat;
window.sendQuickQuestion = sendQuickQuestion;
window.generateRestockChart = generateRestockChart;

// Chatbot functionality
async function handleChatMessage(e) {
    e.preventDefault();
    
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Clear input
    chatInput.value = '';
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Send message to chatbot (backend will fetch current data)
        const response = await apiCall('/chat', {
            method: 'POST',
            body: JSON.stringify({ 
                message: message
            })
        });
        
        // Remove typing indicator
        hideTypingIndicator();
        
        // Add bot response to chat
        addMessageToChat(response.reply, 'bot');
        
    } catch (error) {
        console.error('Chat error:', error);
        hideTypingIndicator();
        addMessageToChat('I apologize, but I\'m experiencing technical difficulties. Please try again later.', 'bot');
    }
}

function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    // Convert markdown-like formatting to HTML
    const formattedMessage = formatChatMessage(message);
    content.innerHTML = formattedMessage;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatChatMessage(message) {
    // Enhanced markdown-like formatting for better display
    return message
        // Bold text with **text** or __text__
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        // Italic text with *text* or _text_
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        // Headers with ## or ###
        .replace(/^### (.*$)/gm, '<h4>$1</h4>')
        .replace(/^## (.*$)/gm, '<h3>$1</h3>')
        .replace(/^# (.*$)/gm, '<h2>$1</h2>')
        // Bullet points with • or -
        .replace(/^• (.*$)/gm, '<li>$1</li>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/^\* (.*$)/gm, '<li>$1</li>')
        // Wrap consecutive list items in ul tags
        .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
        // Line breaks and paragraphs
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^(.*)$/, '<p>$1</p>')
        // Clean up empty paragraphs
        .replace(/<p><\/p>/g, '')
        .replace(/<p><br><\/p>/g, '');
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot-message typing-indicator';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function sendQuickQuestion(question) {
    const chatInput = document.getElementById('chatInput');
    chatInput.value = question;
    
    // Trigger the chat form submission
    const event = new Event('submit', { bubbles: true, cancelable: true });
    chatForm.dispatchEvent(event);
}

function clearChat() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = `
        <div class="chat-message bot-message">
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p><strong>Hello! I'm your AI healthcare inventory assistant.</strong></p>
                <p>I provide quick, actionable advice about your clinic's inventory. Ask me about:</p>
                <ul>
                    <li>Current stock levels & alerts</li>
                    <li>Reorder recommendations</li>
                    <li>Usage patterns & optimization</li>
                    <li>Specific item guidance</li>
                </ul>
                <p>💡 <em>I'll keep my answers short and focused on immediate actions.</em></p>
            </div>
        </div>
    `;
}

// Automated Restock Functions
async function showAutomatedRestockModal() {
    console.log('🔧 showAutomatedRestockModal called');
    try {
        showLoading();
        
        console.log('📡 Calling automated-restock-preview API...');
        // Get preview of what would be restocked
        const preview = await apiCall('/automated-restock-preview');
        
        console.log('📊 Preview data received:', preview);
        hideLoading();
        
        if (preview.totalItems === 0) {
            showToast('No high priority items need restocking at this time! 🎉', 'info');
            return;
        }
        
        // Create modal if it doesn't exist
        let modal = document.getElementById('automatedRestockModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'automatedRestockModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2><i class="fas fa-magic"></i> Automated High Priority Restock</h2>
                        <span class="close" onclick="closeAutomatedRestockModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="restock-preview">
                            <div class="preview-summary">
                                <h3>Items to be automatically restocked:</h3>
                                <div class="summary-stats">
                                    <span class="stat"><strong>${preview.totalItems}</strong> high priority items</span>
                                    <span class="stat"><strong>${preview.totalQuantity}</strong> total units</span>
                                </div>
                            </div>
                            <div class="preview-items" id="automatedRestockItems">
                                <!-- Items will be populated here -->
                            </div>
                            <div class="restock-warning">
                                <i class="fas fa-info-circle"></i>
                                <p>This will create an automated purchase order and immediately update your inventory levels. Only items at or below their minimum threshold will be restocked.</p>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-secondary" onclick="closeAutomatedRestockModal()">Cancel</button>
                            <button class="btn btn-success" onclick="executeAutomatedRestock()">
                                <i class="fas fa-bolt"></i> Execute Automated Restock
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Populate items list
        const itemsContainer = modal.querySelector('#automatedRestockItems');
        itemsContainer.innerHTML = preview.items.map(item => `
            <div class="restock-item">
                <div class="item-info">
                    <span class="item-name">${item.itemName}</span>
                    <span class="item-status">
                        <span class="current-stock critical">Current: ${item.currentStock}</span>
                        <span class="min-threshold">Min: ${item.minThreshold}</span>
                        ${item.daysUntilEmpty !== null ? 
                            `<span class="days-empty ${item.daysUntilEmpty <= 3 ? 'critical' : 'warning'}">
                                ${item.daysUntilEmpty} days left
                            </span>` : 
                            '<span class="no-usage">No recent usage</span>'
                        }
                    </span>
                </div>
                <div class="restock-quantity">
                    <i class="fas fa-arrow-right"></i>
                    <span class="quantity">+${item.suggestedQuantity} units</span>
                    <span class="new-total">= ${item.currentStock + item.suggestedQuantity} total</span>
                </div>
            </div>
        `).join('');
        
        // Store preview data for execution
        window.automatedRestockPreview = preview;
        
        modal.style.display = 'block';
        
    } catch (error) {
        hideLoading();
        console.error('❌ Failed to load automated restock preview:', error);
        showToast('Failed to load restock preview: ' + error.message, 'error');
    }
}

function closeAutomatedRestockModal() {
    const modal = document.getElementById('automatedRestockModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function executeAutomatedRestock() {
    const confirmation = confirm(
        `Are you sure you want to execute automated restock for ${window.automatedRestockPreview.totalItems} high priority items?\n\n` +
        `This will:\n` +
        `• Add ${window.automatedRestockPreview.totalQuantity} total units to inventory\n` +
        `• Create an automated purchase order\n` +
        `• Update stock levels immediately\n\n` +
        `This action cannot be undone.`
    );
    
    if (!confirmation) return;
    
    try {
        showLoading();
        
        const result = await apiCall('/automated-restock', {
            method: 'POST'
        });
        
        if (result.success) {
            const successMessage = `✅ Automated restock completed successfully!\n\n` +
                `• ${result.itemsRestocked} items restocked\n` +
                `• ${result.totalQuantity} total units added\n` +
                `• Purchase order #${result.order.id.substr(-8)} created`;
            
            showToast(successMessage, 'success');
            
            // Refresh all relevant data
            await Promise.all([
                loadInventory(),
                loadPurchaseOrders(),
                loadRestockSuggestions(),
                loadAlerts()
            ]);
            
            closeAutomatedRestockModal();
        } else {
            showToast(result.message || 'No items were restocked', 'info');
        }
        
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Failed to execute automated restock:', error);
        showToast('Failed to execute automated restock', 'error');
    }
}

// Make functions available globally
window.showAutomatedRestockModal = showAutomatedRestockModal;
window.closeAutomatedRestockModal = closeAutomatedRestockModal;
window.executeAutomatedRestock = executeAutomatedRestock;
