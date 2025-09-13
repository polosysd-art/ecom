// Admin Dashboard JavaScript - DO NOT EDIT
import { db, auth } from '../../frontend/config/firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc,
    query,
    orderBy,
    where
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

let currentUser = null;
let products = [];
let orders = [];

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    setupEventListeners();
    loadProducts();
    loadOrders();
});

// Check admin authentication
function checkAdminAuth() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            // In a real app, check if user has admin role
            console.log('Admin logged in:', user.email);
        } else {
            // Redirect to login if not authenticated
            window.location.href = '../../frontend/login.html';
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Navigation - both old buttons and new sidebar
    document.querySelectorAll('.nav-btn, .nav-item[data-section]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const section = btn.dataset.section;
            if (section) {
                switchSection(section);
            }
        });
    });
    
    // Logout
    document.getElementById('admin-logout').addEventListener('click', async (e) => {
        e.preventDefault();
        if (window.navigation) {
            window.navigation.handleLogout();
        }
    });
    
    // Add product
    document.getElementById('add-product-btn').addEventListener('click', () => {
        openProductModal();
    });
    
    // Product form
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
    
    // Modal close
    document.querySelector('.close').addEventListener('click', closeProductModal);
    
    // Order filter
    document.getElementById('order-filter').addEventListener('change', filterOrders);
}

// Switch sections
function switchSection(section) {
    // Update nav buttons and sidebar items
    document.querySelectorAll('.nav-btn, .nav-item[data-section]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll(`[data-section="${section}"]`).forEach(el => {
        el.classList.add('active');
    });
    
    // Update sections
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');
    
    // Load data for section
    if (section === 'orders') loadOrders();
    if (section === 'users') loadUsers();
    if (section === 'settings') window.loadStoreSettings();
    if (section === 'attributes') initializeAttributes();
}

// Load products
async function loadProducts() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        displayProducts();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Display products
function displayProducts() {
    const container = document.getElementById('products-list');
    
    if (products.length === 0) {
        container.innerHTML = '<p>No products found. Add your first product!</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-admin-card">
            <img src="${product.image || 'https://via.placeholder.com/250x150'}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p><strong>Category:</strong> ${product.category}</p>
            <div class="price">$${product.price.toFixed(2)}</div>
            <div class="product-actions">
                <button class="btn edit-btn" onclick="editProduct('${product.id}')">Edit</button>
                <button class="btn delete-btn" onclick="deleteProduct('${product.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Open product modal
function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('product-form');
    
    if (productId) {
        const product = products.find(p => p.id === productId);
        title.textContent = 'Edit Product';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-image').value = product.image || '';
        document.getElementById('product-category').value = product.category;
    } else {
        title.textContent = 'Add Product';
        form.reset();
        document.getElementById('product-id').value = '';
    }
    
    modal.style.display = 'block';
}

// Close product modal
function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}

// Handle product form submission
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        price: parseFloat(document.getElementById('product-price').value),
        image: document.getElementById('product-image').value,
        category: document.getElementById('product-category').value
    };
    
    const productId = document.getElementById('product-id').value;
    
    try {
        if (productId) {
            // Update existing product
            await updateDoc(doc(db, "products", productId), productData);
        } else {
            // Add new product
            await addDoc(collection(db, "products"), productData);
        }
        
        closeProductModal();
        loadProducts();
        alert('Product saved successfully!');
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Error saving product. Please try again.');
    }
}

// Delete product
async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await deleteDoc(doc(db, "products", productId));
            loadProducts();
            alert('Product deleted successfully!');
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product. Please try again.');
        }
    }
}

// Load orders
async function loadOrders() {
    try {
        const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        orders = [];
        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        displayOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Display orders
function displayOrders(filteredOrders = orders) {
    const container = document.getElementById('orders-list');
    
    if (filteredOrders.length === 0) {
        container.innerHTML = '<p>No orders found.</p>';
        return;
    }
    
    container.innerHTML = filteredOrders.map(order => `
        <div class="order-item">
            <div class="order-info">
                <h4>Order #${order.id.substring(0, 8)}</h4>
                <p><strong>Customer:</strong> ${order.customerInfo.name}</p>
                <p><strong>Email:</strong> ${order.customerInfo.email}</p>
                <p><strong>Date:</strong> ${new Date(order.timestamp.seconds * 1000).toLocaleDateString()}</p>
            </div>
            <div class="order-info">
                <p><strong>Items:</strong> ${order.items.length}</p>
                <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
            </div>
            <div class="order-status status-${order.status || 'pending'}">
                ${(order.status || 'pending').toUpperCase()}
            </div>
            <div class="order-actions">
                <button class="btn status-btn" onclick="updateOrderStatus('${order.id}', 'completed')">Complete</button>
                <button class="btn delete-btn status-btn" onclick="updateOrderStatus('${order.id}', 'cancelled')">Cancel</button>
            </div>
        </div>
    `).join('');
}

// Filter orders
function filterOrders() {
    const filter = document.getElementById('order-filter').value;
    if (filter === 'all') {
        displayOrders();
    } else {
        const filtered = orders.filter(order => (order.status || 'pending') === filter);
        displayOrders(filtered);
    }
}

// Update order status
async function updateOrderStatus(orderId, status) {
    try {
        await updateDoc(doc(db, "orders", orderId), { status });
        loadOrders();
        alert(`Order ${status} successfully!`);
    } catch (error) {
        console.error('Error updating order:', error);
        alert('Error updating order. Please try again.');
    }
}

// Load users (placeholder)
function loadUsers() {
    const container = document.getElementById('users-list');
    container.innerHTML = '<p>User management feature coming soon...</p>';
}

// Product Attributes Management
let attributes = {
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
    units: []
};

// Load attributes
async function loadAttributes() {
    try {
        const { getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        const attributesDoc = await getDoc(doc(db, 'settings', 'attributes'));
        if (attributesDoc.exists()) {
            attributes = { ...attributes, ...attributesDoc.data() };
        }
        renderAttributes();
    } catch (error) {
        console.error('Error loading attributes:', error);
    }
}

// Render attributes
function renderAttributes() {
    Object.keys(attributes).forEach(type => {
        const container = document.getElementById(`${type}-list`);
        if (container) {
            container.innerHTML = attributes[type].map(item => `
                <div class="attribute-item">
                    <span>${item}</span>
                    <button class="delete-attr-btn" onclick="removeAttribute('${type}', '${item}')">&times;</button>
                </div>
            `).join('');
        }
    });
}

// Add attribute
window.addAttribute = async (type) => {
    const input = document.getElementById(`new-${type.slice(0, -1)}`);
    const value = input.value.trim();
    
    if (value && !attributes[type].includes(value)) {
        attributes[type].push(value);
        await saveAttributes();
        input.value = '';
        renderAttributes();
    }
};

// Remove attribute - handled by product-settings.js

// Save attributes to database
async function saveAttributes() {
    try {
        const { setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        await setDoc(doc(db, 'settings', 'attributes'), attributes);
    } catch (error) {
        console.error('Error saving attributes:', error);
    }
}

// Initialize attributes when switching to attributes section
function initializeAttributes() {
    loadAttributes();
}

// Make functions global for onclick handlers
window.editProduct = (productId) => openProductModal(productId);
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;
window.initializeAttributes = initializeAttributes;