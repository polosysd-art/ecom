// CRM Management
import { db } from './firebase-config.js';
import { collection, getDocs, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

let customers = [];
let orders = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCustomerData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Skip tab and modal setup since we're using messenger layout
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Load customer data with real-time updates
function loadCustomerData() {
    console.log('=== CRM DEBUG START ===');
    console.log('Database object exists:', !!db);
    console.log('Collection function exists:', !!collection);
    console.log('onSnapshot function exists:', !!onSnapshot);
    
    try {
        // Load users from database
        console.log('Attempting to connect to users collection...');
        onSnapshot(collection(db, 'users'), (usersSnapshot) => {
            console.log('✅ Successfully connected to users collection');
            console.log('Users found:', usersSnapshot.size);
            
            if (usersSnapshot.size === 0) {
                console.log('❌ No users found in database');
                return;
            }
            customers = [];
            usersSnapshot.forEach((doc) => {
                const userData = doc.data();
                console.log('User data:', userData);
                customers.push({
                    id: doc.id,
                    email: userData.email || 'N/A',
                    name: userData.displayName || userData.name || userData.email || 'N/A',
                    createdAt: userData.createdAt || new Date().toISOString(),
                    lastLogin: userData.lastLogin || userData.createdAt || new Date().toISOString(),
                    phone: userData.phone || 'N/A',
                    address: userData.address || 'N/A'
                });
            });
            
            console.log('Processed customers:', customers.length);
            
            console.log('Final customers array:', customers);
            customers.sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin));
            window.customers = customers;
            renderCustomers();
        }, (error) => {
            console.error('❌ Firestore listener error:', error.code, error.message);
        });
    } catch (error) {
        console.error('Error setting up customer data listener:', error);
    }
}

// Render customers
function renderCustomers() {
    const container = document.getElementById('customers-list');
    if (customers.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = customers.map(customer => `
        <div class="chat-item" onclick="selectCustomer('${customer.id}')" data-customer="${customer.id}">
            <div class="chat-avatar" style="background: #3498db; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                <i class="fas fa-user"></i>
            </div>
            <div class="chat-info">
                <div class="chat-name">${customer.name}</div>
                <div class="chat-preview">${customer.email}</div>
            </div>
        </div>
    `).join('');
}

// Render analytics
function renderAnalytics() {
    const totalCustomers = customers.length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const newCustomersThisMonth = customers.filter(customer => {
        const firstOrderDate = new Date(customer.firstOrder);
        return firstOrderDate.getMonth() === currentMonth && firstOrderDate.getFullYear() === currentYear;
    }).length;
    
    const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
    const avgOrderValue = totalRevenue / orders.length || 0;
    
    const repeatCustomers = customers.filter(customer => customer.totalOrders > 1).length;
    const repeatCustomerRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers * 100) : 0;
    
    // Update stats
    document.getElementById('total-customers').textContent = `Total Customers: ${totalCustomers}`;
    document.getElementById('active-customers').textContent = `Active: ${customers.filter(c => {
        const lastOrder = new Date(c.lastOrder);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return lastOrder > thirtyDaysAgo;
    }).length}`;
    
    document.getElementById('new-customers').textContent = newCustomersThisMonth;
    document.getElementById('avg-order-value').textContent = `$${avgOrderValue.toFixed(2)}`;
    document.getElementById('repeat-customers').textContent = `${repeatCustomerRate.toFixed(1)}%`;
}

// View customer details
window.viewCustomer = (customerEmail) => {
    const customer = customers.find(c => c.email === customerEmail);
    if (!customer) return;
    
    const modal = document.getElementById('customer-modal');
    const details = document.getElementById('customer-details');
    
    details.innerHTML = `
        <div class="customer-detail-section">
            <h4>Customer Information</h4>
            <p><strong>Name:</strong> ${customer.name}</p>
            <p><strong>Email:</strong> ${customer.email}</p>
            <p><strong>First Order:</strong> ${new Date(customer.firstOrder).toLocaleDateString()}</p>
            <p><strong>Last Order:</strong> ${new Date(customer.lastOrder).toLocaleDateString()}</p>
        </div>
        
        <div class="customer-detail-section">
            <h4>Order Summary</h4>
            <p><strong>Total Orders:</strong> ${customer.totalOrders}</p>
            <p><strong>Total Spent:</strong> $${customer.totalSpent.toFixed(2)}</p>
            <p><strong>Average Order:</strong> $${(customer.totalSpent / customer.totalOrders).toFixed(2)}</p>
        </div>
        
        <div class="customer-detail-section">
            <h4>Recent Orders</h4>
            ${customer.orders.slice(0, 5).map(order => `
                <div class="customer-order">
                    <p><strong>Order #${order.id.substring(0, 8)}</strong></p>
                    <p>Date: ${new Date(order.createdAt).toLocaleDateString()} | Total: $${order.total.toFixed(2)}</p>
                    <p>Status: ${order.status || 'pending'}</p>
                </div>
            `).join('')}
        </div>
    `;
    
    modal.style.display = 'block';
};

// Close customer modal
function closeCustomerModal() {
    document.getElementById('customer-modal').style.display = 'none';
}