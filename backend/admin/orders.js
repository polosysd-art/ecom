// Orders Management
import { db } from '../../frontend/config/firebase-config.js';
import { collection, getDocs, updateDoc, doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

let orders = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    document.querySelector('.close').addEventListener('click', closeOrderModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('order-modal')) {
            closeOrderModal();
        }
    });
}

// Load orders with real-time updates
function loadOrders() {
    try {
        onSnapshot(collection(db, 'orders'), (querySnapshot) => {
            orders = [];
            querySnapshot.forEach((doc) => {
                orders.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort by date (newest first)
            orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            renderOrders();
            updateOrderStats();
        });
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Render orders
function renderOrders() {
    const container = document.getElementById('orders-list');
    if (orders.length === 0) {
        container.innerHTML = '<p>No orders found.</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-info">
                <h4>Order #${order.id.substring(0, 8)}</h4>
                <p>Customer: ${order.customerEmail || 'Guest'}</p>
                <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="order-total">
                <strong>$${order.total.toFixed(2)}</strong>
                <p>${order.items?.length || 0} items</p>
            </div>
            <div class="order-status">
                <span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span>
            </div>
            <div class="order-actions">
                <button class="btn" onclick="viewOrder('${order.id}')">View</button>
                <select onchange="updateOrderStatus('${order.id}', this.value)">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
        </div>
    `).join('');
}

// Update order stats
function updateOrderStats() {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending' || !o.status).length;
    const completed = orders.filter(o => o.status === 'delivered').length;
    
    document.getElementById('total-orders').textContent = `Total: ${total}`;
    document.getElementById('pending-orders').textContent = `Pending: ${pending}`;
    document.getElementById('completed-orders').textContent = `Completed: ${completed}`;
}

// View order details
window.viewOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const modal = document.getElementById('order-modal');
    const details = document.getElementById('order-details');
    
    details.innerHTML = `
        <div class="order-detail-section">
            <h4>Order Information</h4>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Status:</strong> ${order.status || 'pending'}</p>
            <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        </div>
        
        <div class="order-detail-section">
            <h4>Customer Information</h4>
            <p><strong>Email:</strong> ${order.customerEmail || 'Guest'}</p>
            <p><strong>Name:</strong> ${order.customerName || 'N/A'}</p>
        </div>
        
        <div class="order-detail-section">
            <h4>Items Ordered</h4>
            ${order.items?.map(item => `
                <div class="order-item-detail">
                    <p><strong>${item.name}</strong></p>
                    <p>Quantity: ${item.quantity} × $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}</p>
                </div>
            `).join('') || '<p>No items found</p>'}
        </div>
    `;
    
    modal.style.display = 'block';
};

// Update order status
window.updateOrderStatus = async (orderId, newStatus) => {
    try {
        await updateDoc(doc(db, 'orders', orderId), {
            status: newStatus,
            updatedAt: new Date().toISOString()
        });
        
        // Update local data
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            updateOrderStats();
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Error updating order status');
    }
};

// Close order modal
function closeOrderModal() {
    document.getElementById('order-modal').style.display = 'none';
}