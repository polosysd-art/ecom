// Admin Dashboard JavaScript - DO NOT EDIT
import { db, auth } from './firebase-config.js';
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
            window.location.href = './login.html';
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
    
    container.innerHTML = '';
    products.forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });
}

// Create product card element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-admin-card';
    
    const img = document.createElement('img');
    img.src = product.image || 'https://via.placeholder.com/250x150';
    img.alt = escapeHtml(product.name || '');
    
    const title = document.createElement('h3');
    title.textContent = product.name || '';
    
    const desc = document.createElement('p');
    desc.textContent = product.description || '';
    
    const category = document.createElement('p');
    category.innerHTML = '<strong>Category:</strong> ' + escapeHtml(product.category || '');
    
    const price = document.createElement('div');
    price.className = 'price';
    const priceValue = isValidNumber(product.price) ? product.price.toFixed(2) : '0.00';
    price.textContent = `$${priceValue}`;
    
    const actions = document.createElement('div');
    actions.className = 'product-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editProduct(product.id));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteProduct(product.id));
    
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(category);
    card.appendChild(price);
    card.appendChild(actions);
    
    return card;
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
        showNotification('Product saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('Error saving product. Please try again.', 'error');
    }
}

// Delete product
async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await deleteDoc(doc(db, "products", productId));
            loadProducts();
            showNotification('Product deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting product:', error);
            showNotification('Error deleting product. Please try again.', 'error');
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
        showNotification(`Order ${status} successfully!`, 'success');
    } catch (error) {
        console.error('Error updating order:', error);
        showNotification('Error updating order. Please try again.', 'error');
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
            container.innerHTML = '';
            attributes[type].forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'attribute-item';
                
                const span = document.createElement('span');
                span.textContent = item;
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-attr-btn';
                deleteBtn.textContent = '×';
                deleteBtn.addEventListener('click', () => removeAttribute(type, item));
                
                itemDiv.appendChild(span);
                itemDiv.appendChild(deleteBtn);
                container.appendChild(itemDiv);
            });
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

// Security utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function isValidNumber(value) {
    return !isNaN(value) && isFinite(value);
}

function showNotification(message, type = 'success') {
    if (window.navigation) {
        window.navigation.showNotification(message, type);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}