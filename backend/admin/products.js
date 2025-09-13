// Products Management
import { db, auth } from '../../frontend/config/firebase-config.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

let products = [];
let editingProductId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
});

// Load product settings
async function loadProductSettings() {
    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'attributes'));
        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            populateDropdowns(data);
        } else {
            // Create default settings if none exist
            populateDropdowns({ categories: [], brands: [], colors: [], sizes: [], units: [] });
        }
    } catch (error) {
        console.error('Error loading product settings:', error);
        populateDropdowns({ categories: [], brands: [], colors: [], sizes: [], units: [] });
    }
}

// Populate dropdowns
function populateDropdowns(settings) {
    const dropdowns = [
        { element: document.getElementById('new-category'), data: settings.categories || [], type: 'Category', key: 'categories' },
        { element: document.getElementById('new-brand'), data: settings.brands || [], type: 'Brand', key: 'brands' },
        { element: document.getElementById('new-color-attr'), data: settings.colors || [], type: 'Color', key: 'colors' },
        { element: document.getElementById('new-size-attr'), data: settings.sizes || [], type: 'Size', key: 'sizes' },
        { element: document.getElementById('new-unit-attr'), data: settings.units || [], type: 'Unit', key: 'units' }
    ];
    
    dropdowns.forEach(dropdown => {
        if (dropdown.element) {
            dropdown.element.innerHTML = `<option value="">Select ${dropdown.type}</option>`;
            dropdown.data.forEach(item => {
                dropdown.element.innerHTML += `<option value="${item}">${item}</option>`;
            });
            dropdown.element.innerHTML += `<option value="CREATE_NEW">+ Create New ${dropdown.type}</option>`;
            
            dropdown.element.addEventListener('change', async function() {
                if (this.value === 'CREATE_NEW') {
                    const newValue = prompt(`Enter new ${dropdown.type.toLowerCase()}:`);
                    if (newValue && newValue.trim()) {
                        const trimmedValue = newValue.trim();
                        
                        // Add to dropdown
                        const option = document.createElement('option');
                        option.value = trimmedValue;
                        option.textContent = trimmedValue;
                        option.selected = true;
                        this.insertBefore(option, this.lastElementChild);
                        
                        // Save to product settings
                        await saveNewAttribute(dropdown.key, trimmedValue);
                    } else {
                        this.value = '';
                    }
                }
            });
        }
    });
}

// Save new attribute to product settings
async function saveNewAttribute(attributeType, value) {
    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'attributes'));
        let attributes = { categories: [], brands: [], colors: [], sizes: [], units: [] };
        
        if (settingsDoc.exists()) {
            attributes = settingsDoc.data();
        }
        
        if (!attributes[attributeType]) {
            attributes[attributeType] = [];
        }
        
        if (!attributes[attributeType].includes(value)) {
            attributes[attributeType].push(value);
            await setDoc(doc(db, 'settings', 'attributes'), attributes);
        }
    } catch (error) {
        console.error('Error saving new attribute:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('add-product-btn').addEventListener('click', showAddProduct);
    document.getElementById('product-form').addEventListener('submit', handleProductSave);
    document.querySelector('.close').addEventListener('click', closeProductModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('product-modal')) {
            closeProductModal();
        }
    });
}

// Show add product form
function showAddProduct() {
    if (window.innerWidth <= 768) {
        // Mobile: Show full page form with sticky save
        document.querySelector('.messenger-container').innerHTML = `
            <div class="mobile-add-form">
                <div class="mobile-header">
                    <h3>Add Product</h3>
                </div>
                <form class="product-form" id="mobile-add-form" onsubmit="addProduct(event)">
                    <div class="form-group">
                        <label>Product Name *</label>
                        <input type="text" id="new-name" required>
                    </div>
                    <div class="form-group">
                        <label>Price *</label>
                        <div class="price-row">
                            <input type="number" id="new-price" step="0.01" required>
                            <span class="final-amount" id="final-amount">Final: ₹0.00</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Discount</label>
                        <div class="discount-row">
                            <select id="new-discount-type">
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed Amount</option>
                            </select>
                            <input type="number" id="new-discount" min="0" placeholder="0">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Stock</label>
                        <input type="number" id="new-stock" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label>Minimum Stock</label>
                        <input type="number" id="new-min-stock" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label>Category *</label>
                        <select id="new-category" required></select>
                    </div>
                    <div class="form-group">
                        <label>Product Images *</label>
                        <input type="text" class="image-upload-input" onclick="document.getElementById('new-image').click()" placeholder="Click to upload images" readonly>
                        <input type="file" id="new-image" accept="image/*" multiple onchange="previewImages(this)" style="display: none;">
                        <div class="image-preview" id="image-preview"></div>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <input type="text" id="new-description">
                    </div>
                    <div class="form-group">
                        <label>Brand</label>
                        <select id="new-brand"></select>
                    </div>
                    <div class="form-group">
                        <label>Color</label>
                        <select id="new-color-attr"></select>
                    </div>
                    <div class="form-group">
                        <label>Size</label>
                        <select id="new-size-attr"></select>
                    </div>
                    <div class="form-group">
                        <label>Unit</label>
                        <select id="new-unit-attr"></select>
                    </div>
                </form>
                <div class="sticky-bottom">
                    <button type="button" class="btn-cancel" onclick="location.reload()">Cancel</button>
                    <button type="submit" form="mobile-add-form" class="btn-save">Add Product</button>
                </div>
            </div>
        `;
        loadProductSettings();
        setTimeout(setupDiscountCalculation, 100);
    } else {
        // Desktop: Show in detail section
        const detailView = document.getElementById('product-detail');
        detailView.innerHTML = `
            <div class="product-detail-view">
                <div class="detail-header">
                    <h3>Add New Product</h3>
                    <button type="submit" form="desktop-add-form" class="btn-save">Add Product</button>
                </div>
                <div class="detail-content">
                    <form class="product-form" id="desktop-add-form" onsubmit="addProduct(event)">
                        <div class="form-group">
                            <label>Product Name *</label>
                            <input type="text" id="new-name" required>
                        </div>
                        <div class="form-group">
                            <label>Price *</label>
                            <div class="price-row">
                                <input type="number" id="new-price" step="0.01" required>
                                <span class="final-amount" id="final-amount">Final: ₹0.00</span>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Discount</label>
                            <div class="discount-row">
                                <select id="new-discount-type">
                                    <option value="percentage">Percentage</option>
                                    <option value="fixed">Fixed Amount</option>
                                </select>
                                <input type="number" id="new-discount" min="0" placeholder="0">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Stock</label>
                            <input type="number" id="new-stock" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label>Minimum Stock</label>
                            <input type="number" id="new-min-stock" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label>Category *</label>
                            <select id="new-category" required></select>
                        </div>
                        <div class="form-group">
                            <label>Product Images *</label>
                            <button type="button" class="btn-save" onclick="document.getElementById('new-image').click()">
                                Upload Images
                            </button>
                            <input type="file" id="new-image" accept="image/*" multiple onchange="previewImages(this)" style="display: none;">
                            <div class="image-preview" id="image-preview"></div>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <input type="text" id="new-description">
                        </div>
                        <div class="form-group">
                            <label>Brand</label>
                            <select id="new-brand"></select>
                        </div>
                        <div class="form-group">
                            <label>Color</label>
                            <select id="new-color-attr"></select>
                        </div>
                        <div class="form-group">
                            <label>Size</label>
                            <select id="new-size-attr"></select>
                        </div>
                        <div class="form-group">
                            <label>Unit</label>
                            <select id="new-unit-attr"></select>
                        </div>

                    </form>
                </div>
            </div>
        `;
        loadProductSettings();
        setTimeout(setupDiscountCalculation, 100);
    }
}

// Load products with real-time updates
function loadProducts() {
    console.log('Loading products...');
    try {
        const unsubscribe = onSnapshot(collection(db, 'products'), (querySnapshot) => {
            console.log('Products snapshot received:', querySnapshot.size, 'documents');
            products = [];
            querySnapshot.forEach((doc) => {
                console.log('Product:', doc.id, doc.data());
                products.push({ id: doc.id, ...doc.data() });
            });
            console.log('Total products loaded:', products.length);
            renderProducts();
        }, (error) => {
            console.error('Error in products listener:', error);
            const grid = document.getElementById('products-grid');
            if (grid) {
                grid.innerHTML = `<p>Error loading products: ${error.message}</p>`;
            }
        });
    } catch (error) {
        console.error('Error setting up products listener:', error);
        const grid = document.getElementById('products-grid');
        if (grid) {
            grid.innerHTML = `<p>Error connecting to database: ${error.message}</p>`;
        }
    }
}

// Render products as chat heads
function renderProducts() {
    console.log('Rendering products:', products.length);
    const grid = document.getElementById('products-grid');
    if (!grid) {
        console.error('Products grid element not found');
        return;
    }
    
    if (products.length === 0) {
        grid.innerHTML = '<p>No products found. Add your first product!</p>';
        return;
    }
    
    grid.innerHTML = products.map(product => {
        const firstImage = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/50x50';
        const finalPrice = calculateFinalPrice(product.price, product.discount, product.discountType);
        
        const isOutOfStock = (product.stock || 0) === 0;
        const isLowStock = (product.stock || 0) <= (product.minStock || 0) && (product.minStock || 0) > 0 && !isOutOfStock;
        
        return `
            <div class="chat-item" onclick="selectProduct('${product.id}')">
                <img src="${firstImage}" alt="${product.name}" class="chat-avatar">
                <div class="chat-info">
                    <div class="chat-name">${product.name}</div>
                    <div class="chat-preview">₹${finalPrice.toFixed(2)} • Stock: ${product.stock || 0}</div>
                </div>
                <div class="badge-container">
                    ${isOutOfStock ? `<div class="outofstock-badge">OUT OF STOCK</div>` : ''}
                    ${isLowStock ? `<div class="warning-badge">LOW STOCK</div>` : ''}
                    ${product.discount ? `<div class="status-badge">${product.discount}${product.discountType === 'percentage' ? '%' : '₹'} OFF</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Calculate final price
function calculateFinalPrice(price, discount, discountType) {
    if (!discount) return price;
    if (discountType === 'percentage') {
        return price - (price * discount / 100);
    } else {
        return price - discount;
    }
}

// Select product
window.selectProduct = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const finalPrice = calculateFinalPrice(product.price, product.discount, product.discountType);
    
    if (window.innerWidth <= 768) {
        // Mobile: Full screen view
        document.querySelector('.messenger-container').innerHTML = `
            <div class="mobile-product-view">
                <div class="mobile-header">
                    <button onclick="location.reload()" class="back-btn"><i class="fas fa-arrow-left"></i></button>
                    <h3>${product.name}</h3>
                </div>
                <div class="product-images">
                    ${product.images && product.images.length > 0 ? 
                        product.images.map(img => `<img src="${img}" alt="Product image">`).join('') : 
                        '<img src="https://via.placeholder.com/300x200" alt="No image">'}
                    ${(product.stock || 0) === 0 ? `<div class="images-area-overlay">OUT OF STOCK</div>` : ''}
                </div>
                <div class="product-details">
                    <div class="info-row"><label>Price:</label> <span>₹${product.price}</span></div>
                    ${product.discount ? `<div class="info-row"><label>Discount:</label> <span>${product.discount}${product.discountType === 'percentage' ? '%' : ' ₹'}</span></div>` : ''}
                    <div class="info-row"><label>Final Price:</label> <span class="final-price">₹${finalPrice.toFixed(2)}</span></div>
                    <div class="info-row"><label>Stock:</label> <span>${product.stock || 0}</span></div>
                    <div class="info-row"><label>Category:</label> <span>${product.category || 'N/A'}</span></div>
                    ${product.brand ? `<div class="info-row"><label>Brand:</label> <span>${product.brand}</span></div>` : ''}
                    ${product.color ? `<div class="info-row"><label>Color:</label> <span>${product.color}</span></div>` : ''}
                    ${product.size ? `<div class="info-row"><label>Size:</label> <span>${product.size}</span></div>` : ''}
                    ${product.unit ? `<div class="info-row"><label>Unit:</label> <span>${product.unit}</span></div>` : ''}
                    <div class="info-row"><label>Description:</label> <span>${product.description || 'No description'}</span></div>
                </div>
                <div class="mobile-sticky-buttons">
                    <button onclick="editProduct('${product.id}')" class="btn-edit">Edit Product</button>
                    <button onclick="addStock('${product.id}')" class="add-stock-btn">Add Stock</button>
                    <button onclick="deleteProduct('${product.id}')" class="btn-delete">Delete Product</button>
                </div>
            </div>
        `;
    } else {
        // Desktop: Detail panel
        document.getElementById('product-detail').innerHTML = `
            <div class="product-detail-view">
                <div class="detail-header">
                    <h3>${product.name}</h3>
                    <div class="header-actions">
                        <button onclick="editProduct('${product.id}')" class="btn-edit">Edit</button>
                        <button onclick="addStock('${product.id}')" class="add-stock-btn">Add Stock</button>
                        <button onclick="deleteProduct('${product.id}')" class="btn-delete">Delete</button>
                    </div>
                </div>
                <div class="detail-content">
                    <div class="product-images">
                        ${product.images && product.images.length > 0 ? 
                            product.images.map(img => `<img src="${img}" alt="Product image">`).join('') : 
                            '<img src="https://via.placeholder.com/200x150" alt="No image">'}
                        ${(product.stock || 0) === 0 ? `<div class="images-area-overlay">OUT OF STOCK</div>` : ''}
                    </div>
                    <div class="info-row"><label>Price:</label> <span>₹${product.price}</span></div>
                    ${product.discount ? `<div class="info-row"><label>Discount:</label> <span>${product.discount}${product.discountType === 'percentage' ? '%' : ' ₹'}</span></div>` : ''}
                    <div class="info-row"><label>Final Price:</label> <span class="final-price">₹${finalPrice.toFixed(2)}</span></div>
                    <div class="info-row"><label>Stock:</label> <span>${product.stock || 0}</span></div>
                    <div class="info-row"><label>Category:</label> <span>${product.category || 'N/A'}</span></div>
                    ${product.brand ? `<div class="info-row"><label>Brand:</label> <span>${product.brand}</span></div>` : ''}
                    ${product.color ? `<div class="info-row"><label>Color:</label> <span>${product.color}</span></div>` : ''}
                    ${product.size ? `<div class="info-row"><label>Size:</label> <span>${product.size}</span></div>` : ''}
                    ${product.unit ? `<div class="info-row"><label>Unit:</label> <span>${product.unit}</span></div>` : ''}
                    <div class="info-row"><label>Description:</label> <span>${product.description || 'No description'}</span></div>
                </div>
            </div>
        `;
    }
};

// Open product modal
function openProductModal(productId = null) {
    editingProductId = productId;
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('product-form');
    
    if (productId) {
        const product = products.find(p => p.id === productId);
        title.textContent = 'Edit Product';
        document.getElementById('product-id').value = productId;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-image').value = product.image || '';
        document.getElementById('product-stock').value = product.stock || 0;
    } else {
        title.textContent = 'Add New Product';
        form.reset();
        document.getElementById('product-id').value = '';
    }
    
    modal.style.display = 'block';
}

// Close product modal
function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
    editingProductId = null;
}

// Handle product save
async function handleProductSave(e) {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        price: parseFloat(document.getElementById('product-price').value),
        image: document.getElementById('product-image').value,
        stock: parseInt(document.getElementById('product-stock').value) || 0,
        updatedAt: new Date().toISOString()
    };
    
    try {
        if (editingProductId) {
            await updateDoc(doc(db, 'products', editingProductId), productData);
        } else {
            productData.createdAt = new Date().toISOString();
            await addDoc(collection(db, 'products'), productData);
        }
        
        closeProductModal();
        loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Error saving product');
    }
}

// Edit product
window.editProduct = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (window.innerWidth <= 768) {
        // Mobile: Show full page form
        document.querySelector('.messenger-container').innerHTML = `
            <div class="mobile-add-form">
                <div class="mobile-header">
                    <h3>Edit Product</h3>
                </div>
                <form class="product-form" id="mobile-edit-form" onsubmit="updateProduct(event, '${productId}')">
                    <div class="form-group">
                        <label>Product Name *</label>
                        <input type="text" id="edit-name" value="${product.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Price *</label>
                        <div class="price-row">
                            <input type="number" id="edit-price" step="0.01" value="${product.price}" required>
                            <span class="final-amount" id="edit-final-amount">Final: ₹${product.price}</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Discount</label>
                        <div class="discount-row">
                            <select id="edit-discount-type">
                                <option value="percentage" ${product.discountType === 'percentage' ? 'selected' : ''}>Percentage</option>
                                <option value="fixed" ${product.discountType === 'fixed' ? 'selected' : ''}>Fixed Amount</option>
                            </select>
                            <input type="number" id="edit-discount" min="0" value="${product.discount || 0}" placeholder="0">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Stock</label>
                        <input type="number" id="edit-stock" value="${product.stock || 0}">
                    </div>
                    <div class="form-group">
                        <label>Minimum Stock</label>
                        <input type="number" id="edit-min-stock" value="${product.minStock || 0}" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label>Category *</label>
                        <select id="edit-category" required></select>
                    </div>
                    <div class="form-group">
                        <label>Product Images *</label>
                        <input type="text" class="image-upload-input" onclick="document.getElementById('edit-image').click()" placeholder="Click to upload images" readonly>
                        <input type="file" id="edit-image" accept="image/*" multiple onchange="previewEditImages(this)" style="display: none;">
                        <div class="image-preview" id="edit-image-preview"></div>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <input type="text" id="edit-description" value="${product.description || ''}">
                    </div>
                    <div class="form-group">
                        <label>Brand</label>
                        <select id="edit-brand"></select>
                    </div>
                    <div class="form-group">
                        <label>Color</label>
                        <select id="edit-color-attr"></select>
                    </div>
                    <div class="form-group">
                        <label>Size</label>
                        <select id="edit-size-attr"></select>
                    </div>
                    <div class="form-group">
                        <label>Unit</label>
                        <select id="edit-unit-attr"></select>
                    </div>
                </form>
                <div class="sticky-bottom">
                    <button type="button" class="btn-cancel" onclick="location.reload()">Cancel</button>
                    <button type="submit" form="mobile-edit-form" class="btn-save">Update Product</button>
                </div>
            </div>
        `;
    } else {
        // Desktop: Show in detail section
        document.getElementById('product-detail').innerHTML = `
            <div class="product-detail-view">
                <div class="detail-header">
                    <h3>Edit Product</h3>
                    <button type="submit" form="desktop-edit-form" class="btn-save">Update Product</button>
                </div>
                <div class="detail-content">
                    <form class="product-form" id="desktop-edit-form" onsubmit="updateProduct(event, '${productId}')">
                        <div class="form-group">
                            <label>Product Name *</label>
                            <input type="text" id="edit-name" value="${product.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Price *</label>
                            <div class="price-row">
                                <input type="number" id="edit-price" step="0.01" value="${product.price}" required>
                                <span class="final-amount" id="edit-final-amount">Final: ₹${product.price}</span>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Discount</label>
                            <div class="discount-row">
                                <select id="edit-discount-type">
                                    <option value="percentage" ${product.discountType === 'percentage' ? 'selected' : ''}>Percentage</option>
                                    <option value="fixed" ${product.discountType === 'fixed' ? 'selected' : ''}>Fixed Amount</option>
                                </select>
                                <input type="number" id="edit-discount" min="0" value="${product.discount || 0}" placeholder="0">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Stock</label>
                            <input type="number" id="edit-stock" value="${product.stock || 0}">
                        </div>
                        <div class="form-group">
                            <label>Minimum Stock</label>
                            <input type="number" id="edit-min-stock" value="${product.minStock || 0}" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label>Category *</label>
                            <select id="edit-category" required></select>
                        </div>
                        <div class="form-group">
                            <label>Product Images *</label>
                            <button type="button" class="btn-save" onclick="document.getElementById('edit-image').click()">
                                Upload Images
                            </button>
                            <input type="file" id="edit-image" accept="image/*" multiple onchange="previewEditImages(this)" style="display: none;">
                            <div class="image-preview" id="edit-image-preview"></div>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <input type="text" id="edit-description" value="${product.description || ''}">
                        </div>
                        <div class="form-group">
                            <label>Brand</label>
                            <select id="edit-brand"></select>
                        </div>
                        <div class="form-group">
                            <label>Color</label>
                            <select id="edit-color-attr"></select>
                        </div>
                        <div class="form-group">
                            <label>Size</label>
                            <select id="edit-size-attr"></select>
                        </div>
                        <div class="form-group">
                            <label>Unit</label>
                            <select id="edit-unit-attr"></select>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
    
    // Initialize edit images with existing images
    editImages = product.images ? [...product.images] : [];
    
    // Load settings and setup form
    loadEditProductSettings(product);
    setTimeout(() => {
        setupEditDiscountCalculation();
        updateEditImagePreview();
    }, 100);
};

// Show loading overlay
function showLoading() {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>Adding product...</p>
        </div>
    `;
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        color: white;
    `;
    document.body.appendChild(overlay);
}

// Hide loading overlay
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.remove();
}

// Add product
window.addProduct = async function(event) {
    event.preventDefault();
    
    showLoading();
    
    try {
        const imageFiles = document.getElementById('new-image').files;
        let images = [];
        
        if (imageFiles.length > 0) {
            // Convert all images to base64
            for (let file of imageFiles) {
                const imageUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });
                images.push(imageUrl);
            }
        }
        
        await addDoc(collection(db, 'products'), {
            name: document.getElementById('new-name').value,
            description: document.getElementById('new-description').value || '',
            price: parseFloat(document.getElementById('new-price').value),
            discount: parseFloat(document.getElementById('new-discount').value) || 0,
            discountType: document.getElementById('new-discount-type').value,
            category: document.getElementById('new-category').value,
            brand: document.getElementById('new-brand').value || '',
            color: document.getElementById('new-color-attr').value || '',
            size: document.getElementById('new-size-attr').value || '',
            unit: document.getElementById('new-unit-attr').value || '',
            images: allImages.length > 0 ? allImages : [],
            stock: parseInt(document.getElementById('new-stock').value) || 0,
            minStock: parseInt(document.getElementById('new-min-stock').value) || 0,
            createdAt: new Date().toISOString()
        });
        
        hideLoading();
        showMessage('Product added successfully!', 'success');
        
        // Reset form
        allImages = [];
        document.getElementById('image-preview').innerHTML = '';
        
        if (window.innerWidth <= 768) {
            setTimeout(() => location.reload(), 1500);
        } else {
            document.getElementById('product-detail').innerHTML = `
                <div class="no-selection">
                    <i class="fas fa-box-open"></i>
                    <p>Select a product to view details</p>
                </div>
            `;
        }
    } catch (error) {
        hideLoading();
        alert('Error adding product');
    }
};

let allImages = [];

// Preview multiple images
window.previewImages = function(input) {
    const preview = document.getElementById('image-preview');
    
    if (input.files && input.files.length > 0) {
        showMessage(`${input.files.length} image(s) uploaded successfully`, 'success');
        
        Array.from(input.files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                allImages.push(e.target.result);
                updateImagePreview();
            };
            reader.onerror = function() {
                showMessage('Failed to upload image', 'error');
            };
            reader.readAsDataURL(file);
        });
    }
    
    // Clear file input
    input.value = '';
};

// Update image preview display
function updateImagePreview() {
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '';
    
    allImages.forEach((imageSrc, index) => {
        const imageDiv = document.createElement('div');
        imageDiv.style.cssText = 'position: relative; display: inline-block; margin: 5px;';
        imageDiv.innerHTML = `
            <img src="${imageSrc}" style="max-width: 100px; max-height: 100px; border-radius: 4px;">
            <button type="button" onclick="removeImageFromArray(${index})" style="position: absolute; top: -5px; right: -5px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer;">&times;</button>
        `;
        preview.appendChild(imageDiv);
    });
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 10px 15px;
        border-radius: 4px;
        z-index: 1000;
        color: white;
        ${type === 'success' ? 'background: #27ae60;' : 'background: #e74c3c;'}
    `;
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 3000);
}

// Remove specific image from array
window.removeImageFromArray = function(index) {
    allImages.splice(index, 1);
    updateImagePreview();
};

// Setup discount calculation
function setupDiscountCalculation() {
    const priceInput = document.getElementById('new-price');
    const discountInput = document.getElementById('new-discount');
    const discountType = document.getElementById('new-discount-type');
    const finalAmount = document.getElementById('final-amount');
    
    function calculateFinal() {
        const price = parseFloat(priceInput?.value) || 0;
        const discount = parseFloat(discountInput?.value) || 0;
        const type = discountType?.value || 'percentage';
        
        let final = price;
        if (type === 'percentage') {
            final = price - (price * discount / 100);
        } else {
            final = price - discount;
        }
        
        if (finalAmount) {
            finalAmount.textContent = `Final: ₹${Math.max(0, final).toFixed(2)}`;
        }
    }
    
    priceInput?.addEventListener('input', calculateFinal);
    discountInput?.addEventListener('input', calculateFinal);
    discountType?.addEventListener('change', calculateFinal);
    
    calculateFinal();
}

// Setup edit discount calculation
function setupEditDiscountCalculation() {
    const priceInput = document.getElementById('edit-price');
    const discountInput = document.getElementById('edit-discount');
    const discountType = document.getElementById('edit-discount-type');
    const finalAmount = document.getElementById('edit-final-amount');
    
    function calculateFinal() {
        const price = parseFloat(priceInput?.value) || 0;
        const discount = parseFloat(discountInput?.value) || 0;
        const type = discountType?.value || 'percentage';
        
        let final = price;
        if (type === 'percentage') {
            final = price - (price * discount / 100);
        } else {
            final = price - discount;
        }
        
        if (finalAmount) {
            finalAmount.textContent = `Final: ₹${Math.max(0, final).toFixed(2)}`;
        }
    }
    
    priceInput?.addEventListener('input', calculateFinal);
    discountInput?.addEventListener('input', calculateFinal);
    discountType?.addEventListener('change', calculateFinal);
    
    calculateFinal();
}

// Load edit product settings
async function loadEditProductSettings(product) {
    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'attributes'));
        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            populateEditDropdowns(data, product);
        }
    } catch (error) {
        console.error('Error loading edit product settings:', error);
    }
}

// Populate edit dropdowns
function populateEditDropdowns(settings, product) {
    const dropdowns = [
        { element: document.getElementById('edit-category'), data: settings.categories || [], type: 'Category', key: 'categories', value: product.category },
        { element: document.getElementById('edit-brand'), data: settings.brands || [], type: 'Brand', key: 'brands', value: product.brand },
        { element: document.getElementById('edit-color-attr'), data: settings.colors || [], type: 'Color', key: 'colors', value: product.color },
        { element: document.getElementById('edit-size-attr'), data: settings.sizes || [], type: 'Size', key: 'sizes', value: product.size },
        { element: document.getElementById('edit-unit-attr'), data: settings.units || [], type: 'Unit', key: 'units', value: product.unit }
    ];
    
    dropdowns.forEach(dropdown => {
        if (dropdown.element) {
            dropdown.element.innerHTML = `<option value="">Select ${dropdown.type}</option>`;
            dropdown.data.forEach(item => {
                const selected = item === dropdown.value ? 'selected' : '';
                dropdown.element.innerHTML += `<option value="${item}" ${selected}>${item}</option>`;
            });
            dropdown.element.innerHTML += `<option value="CREATE_NEW">+ Create New ${dropdown.type}</option>`;
        }
    });
    
    // Show existing images
    if (product.images && product.images.length > 0) {
        editImages = [...product.images];
        updateEditImagePreview();
    }
}

let editImages = [];

// Preview edit images
window.previewEditImages = function(input) {
    const preview = document.getElementById('edit-image-preview');
    
    if (input.files && input.files.length > 0) {
        showMessage(`${input.files.length} image(s) uploaded successfully`, 'success');
        
        Array.from(input.files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                editImages.push(e.target.result);
                updateEditImagePreview();
            };
            reader.readAsDataURL(file);
        });
    }
    
    input.value = '';
};

// Update edit image preview
function updateEditImagePreview() {
    const preview = document.getElementById('edit-image-preview');
    if (!preview) return;
    
    preview.innerHTML = '';
    
    editImages.forEach((imageSrc, index) => {
        const imageDiv = document.createElement('div');
        imageDiv.style.cssText = 'position: relative; display: inline-block; margin: 5px;';
        imageDiv.innerHTML = `
            <img src="${imageSrc}" style="max-width: 100px; max-height: 100px; border-radius: 4px;">
            <button type="button" onclick="removeEditImage(${index})" style="position: absolute; top: -5px; right: -5px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer;">&times;</button>
        `;
        preview.appendChild(imageDiv);
    });
}

// Remove edit image
window.removeEditImage = function(index) {
    editImages.splice(index, 1);
    updateEditImagePreview();
};

// Update product
window.updateProduct = async function(event, productId) {
    event.preventDefault();
    
    showLoading();
    
    try {
        await updateDoc(doc(db, 'products', productId), {
            name: document.getElementById('edit-name').value,
            description: document.getElementById('edit-description').value || '',
            price: parseFloat(document.getElementById('edit-price').value),
            discount: parseFloat(document.getElementById('edit-discount').value) || 0,
            discountType: document.getElementById('edit-discount-type').value,
            category: document.getElementById('edit-category').value,
            brand: document.getElementById('edit-brand').value || '',
            color: document.getElementById('edit-color-attr').value || '',
            size: document.getElementById('edit-size-attr').value || '',
            unit: document.getElementById('edit-unit-attr').value || '',
            images: editImages.length > 0 ? editImages : [],
            stock: parseInt(document.getElementById('edit-stock').value) || 0,
            minStock: parseInt(document.getElementById('edit-min-stock').value) || 0,
            updatedAt: new Date().toISOString()
        });
        
        editImages = [];
        
        hideLoading();
        showMessage('Product updated successfully!', 'success');
        
        if (window.innerWidth <= 768) {
            setTimeout(() => location.reload(), 1500);
        } else {
            document.getElementById('product-detail').innerHTML = `
                <div class="no-selection">
                    <i class="fas fa-box-open"></i>
                    <p>Select a product to view details</p>
                </div>
            `;
        }
    } catch (error) {
        hideLoading();
        showMessage('Error updating product', 'error');
    }
};

// Update stock
window.updateStock = async (productId, newStock) => {
    if (newStock < 0) return;
    
    try {
        await updateDoc(doc(db, 'products', productId), {
            stock: newStock
        });
        showMessage('Stock updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating stock:', error);
        showMessage('Error updating stock', 'error');
    }
};

// Add stock
window.addStock = async (productId) => {
    const amount = prompt('Enter stock amount to add:');
    if (amount && !isNaN(amount)) {
        const product = products.find(p => p.id === productId);
        const newStock = (product.stock || 0) + parseInt(amount);
        await updateStock(productId, newStock);
    }
};

// Delete product
window.deleteProduct = async (productId) => {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await deleteDoc(doc(db, 'products', productId));
            showMessage('Product deleted successfully!', 'success');
            if (window.innerWidth <= 768) {
                location.reload();
            } else {
                document.getElementById('product-detail').innerHTML = `
                    <div class="no-selection">
                        <i class="fas fa-box-open"></i>
                        <p>Select a product to view details</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            showMessage('Error deleting product', 'error');
        }
    }
};