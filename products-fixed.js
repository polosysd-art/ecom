// Products Management - Fixed Version
import { db, auth } from './firebase-config.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

let products = [];
let productAttributes = { categories: [], brands: [], colors: [], sizes: [], units: [], vatRates: [] };
let currencySymbol = '₹'; // Default currency

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing products...');
    loadProductAttributes();
    loadProducts();
    setupEventListeners();
});

// Load product attributes from settings
async function loadProductAttributes() {
    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'attributes'));
        if (settingsDoc.exists()) {
            productAttributes = { categories: [], brands: [], colors: [], sizes: [], units: [], vatRates: [], defaultVat: 0, ...settingsDoc.data() };
        }
        
        // Load currency settings
        const currencyDoc = await getDoc(doc(db, 'settings', 'currency'));
        if (currencyDoc.exists()) {
            currencySymbol = currencyDoc.data().symbol || '₹';
        }
    } catch (error) {
        console.error('Error loading product attributes:', error);
    }
}

// Populate dropdown with attributes and add new option
function populateDropdown(elementId, options, selectedValue = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Set default VAT if it's a VAT field and no value selected
    if (elementId.includes('vat') && !selectedValue && productAttributes.defaultVat) {
        selectedValue = productAttributes.defaultVat;
    }
    
    element.innerHTML = '<option value="">Select...</option>';
    options.forEach(option => {
        const selected = option == selectedValue ? 'selected' : '';
        element.innerHTML += `<option value="${option}" ${selected}>${option}</option>`;
    });
    element.innerHTML += '<option value="ADD_NEW">+ Add New</option>';
    
    // Add event listener for "Add New" option
    element.addEventListener('change', async function() {
        if (this.value === 'ADD_NEW') {
            const fieldName = this.id.replace('product-', '').replace('edit-product-', '');
            const newValue = prompt(`Enter new ${fieldName}:`);
            if (newValue && newValue.trim()) {
                const trimmedValue = newValue.trim();
                
                // Add to current dropdown
                const newOption = document.createElement('option');
                newOption.value = trimmedValue;
                newOption.textContent = trimmedValue;
                newOption.selected = true;
                this.insertBefore(newOption, this.lastElementChild);
                
                // Save to product settings
                await saveNewAttribute(fieldName, trimmedValue);
            } else {
                this.value = selectedValue || '';
            }
        }
    });
}

// Save new attribute to product settings
async function saveNewAttribute(attributeType, value) {
    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'attributes'));
        let attributes = { categories: [], brands: [], colors: [], sizes: [], units: [], vatRates: [] };
        
        if (settingsDoc.exists()) {
            attributes = settingsDoc.data();
        }
        
        const fieldMap = {
            'category': 'categories',
            'brand': 'brands',
            'color': 'colors',
            'size': 'sizes',
            'unit': 'units'
        };
        
        const dbField = fieldMap[attributeType] || attributeType;
        
        if (!attributes[dbField]) {
            attributes[dbField] = [];
        }
        
        if (!attributes[dbField].includes(value)) {
            attributes[dbField].push(value);
            await setDoc(doc(db, 'settings', 'attributes'), attributes);
            
            // Update local productAttributes
            productAttributes[dbField].push(value);
        }
    } catch (error) {
        console.error('Error saving new attribute:', error);
    }
}

// Calculate final price with discount and VAT
function calculateFinalPrice(price, discount, discountType, vat) {
    // The 'price' is already the final price including tax
    // So we just apply discount to it
    let finalPrice = price;
    
    // Apply discount to the tax-inclusive price
    if (discount) {
        if (discountType === 'percentage') {
            finalPrice = price - (price * discount / 100);
        } else {
            finalPrice = price - discount;
        }
    }
    
    return finalPrice;
}

// Calculate base price from tax-inclusive price
function calculateBasePrice(taxInclusivePrice, vat) {
    if (!vat) return taxInclusivePrice;
    return taxInclusivePrice / (1 + vat / 100);
}

// Setup price calculation
function setupPriceCalculation(priceId, discountId, discountTypeId, finalPriceId) {
    const priceInput = document.getElementById(priceId);
    const discountInput = document.getElementById(discountId);
    const discountTypeSelect = document.getElementById(discountTypeId);
    const finalPriceSpan = document.getElementById(finalPriceId);
    
    function updateFinalPrice() {
        const price = parseFloat(priceInput?.value) || 0;
        const discount = parseFloat(discountInput?.value) || 0;
        const discountType = discountTypeSelect?.value || 'percentage';
        
        const vatInput = document.getElementById(finalPriceId.replace('final-price', 'vat'));
        const vat = parseFloat(vatInput?.value) || 0;
        const finalPrice = calculateFinalPrice(price, discount, discountType, vat);
        if (finalPriceSpan) {
            finalPriceSpan.textContent = `Final (Inc. Tax): ${currencySymbol}${finalPrice.toFixed(2)}`;
        }
    }
    
    const vatInput = document.getElementById(finalPriceId.replace('final-price', 'vat'));
    
    priceInput?.addEventListener('input', updateFinalPrice);
    discountInput?.addEventListener('input', updateFinalPrice);
    discountTypeSelect?.addEventListener('change', updateFinalPrice);
    vatInput?.addEventListener('change', updateFinalPrice);
    
    updateFinalPrice();
}

// Setup event listeners
function setupEventListeners() {
    const addBtn = document.getElementById('add-product-btn');
    if (addBtn) {
        addBtn.addEventListener('click', showAddProduct);
    }
}

// Load products with real-time updates
function loadProducts() {
    console.log('Loading products...');
    const grid = document.getElementById('products-grid');
    
    if (!grid) {
        console.error('Products grid element not found');
        return;
    }
    
    // Show loading state
    grid.innerHTML = '<div class="p-3 text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Loading products...</div>';
    
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
            grid.innerHTML = `<div class="p-3 text-center text-danger">Error loading products: ${error.message}<br><small>Check console for details</small></div>`;
        });
    } catch (error) {
        console.error('Error setting up products listener:', error);
        grid.innerHTML = `<div class="p-3 text-center text-danger">Error connecting to database: ${error.message}<br><small>Check Firebase configuration</small></div>`;
    }
}

// Render products
function renderProducts() {
    console.log('Rendering products:', products.length);
    const grid = document.getElementById('products-grid');
    if (!grid) {
        console.error('Products grid element not found');
        return;
    }
    
    if (products.length === 0) {
        grid.innerHTML = '<div class="p-3 text-center text-muted">No products found. Add your first product!</div>';
        return;
    }
    
    grid.innerHTML = products.map(product => {
        const firstImage = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/50x50';
        const finalPrice = calculateFinalPrice(product.price, product.discount, product.discountType, product.vat);
        const isOutOfStock = (product.stock || 0) === 0;
        const isLowStock = (product.stock || 0) <= (product.minStock || 0) && (product.minStock || 0) > 0 && !isOutOfStock;
        
        const stockClass = isOutOfStock ? 'stock-out' : isLowStock ? 'stock-low' : 'stock-ok';
        
        return `
            <div class="chat-item ${stockClass}" onclick="selectProduct('${product.id}')" data-product="${product.id}">
                <img src="${firstImage}" alt="${product.name}" class="chat-avatar">
                <div class="chat-info">
                    <div class="chat-name">${product.name}</div>
                    <div class="chat-preview">${currencySymbol}${finalPrice.toFixed(2)} • <span style="color: ${
                        isOutOfStock ? '#dc3545' : isLowStock ? '#ffc107' : '#198754'
                    }; font-weight: bold;">${product.stock || 0} left</span></div>
                </div>
                <div class="chat-status">
                    <span class="status-indicator ${
                        isOutOfStock ? 'status-offline' : isLowStock ? 'status-away' : 'status-online'
                    }"></span>
                    ${product.discount ? `<div class="discount-badge" style="background: #dc3545; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">${product.discount}${product.discountType === 'percentage' ? '%' : currencySymbol}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}



// Select product
window.selectProduct = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const finalPrice = calculateFinalPrice(product.price, product.discount, product.discountType, product.vat);
    
    document.getElementById('product-detail').innerHTML = `
        <div class="product-detail-view">
            <div class="detail-header">
                <h3>${product.name}</h3>
                <div class="header-actions">
                    <button onclick="editProduct('${product.id}')" class="btn btn-outline-primary btn-sm me-2" style="height: 32px; width: 45px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="addStock('${product.id}')" class="btn btn-outline-success btn-sm me-2" style="height: 32px; width: 45px;">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button onclick="deleteProduct('${product.id}')" class="btn btn-outline-danger btn-sm" style="height: 32px; width: 45px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="detail-content">
                <div class="product-images mb-3">
                    ${product.images && product.images.length > 0 ? 
                        product.images.map(img => `<img src="${img}" alt="Product image" style="height: 150px; object-fit: cover; margin: 5px; border-radius: 8px;">`).join('') : 
                        '<img src="https://via.placeholder.com/150x150" alt="No image" style="height: 150px; object-fit: cover; border-radius: 8px;">'}
                </div>
                ${product.vat ? `<div class="info-row"><label>Base Price:</label> <span>${currencySymbol}${calculateBasePrice(product.price, product.vat).toFixed(2)}</span></div>` : ''}
                <div class="info-row"><label>Price (Inc. Tax):</label> <span>${currencySymbol}${product.price}</span></div>
                ${product.discount ? `<div class="info-row"><label>Discount:</label> <span>${product.discount}${product.discountType === 'percentage' ? '%' : ' ' + currencySymbol}</span></div>` : ''}
                <div class="info-row"><label>Final Price (Inc. Tax):</label> <span class="text-success fw-bold">${currencySymbol}${finalPrice.toFixed(2)}</span></div>
                <div class="info-row"><label>Stock:</label> <span>${product.stock || 0}</span></div>
                <div class="info-row"><label>Min Stock:</label> <span>${product.minStock || 0}</span></div>
                <div class="info-row"><label>Category:</label> <span>${product.category || 'N/A'}</span></div>
                ${product.brand ? `<div class="info-row"><label>Brand:</label> <span>${product.brand}</span></div>` : ''}
                ${product.color ? `<div class="info-row"><label>Color:</label> <span>${product.color}</span></div>` : ''}
                ${product.size ? `<div class="info-row"><label>Size:</label> <span>${product.size}</span></div>` : ''}
                ${product.unit ? `<div class="info-row"><label>Unit:</label> <span>${product.unit}</span></div>` : ''}
                ${product.vat ? `<div class="info-row"><label>VAT:</label> <span>${product.vat}%</span></div>` : ''}
                <div class="info-row"><label>Description:</label> <span>${product.description || 'No description'}</span></div>
                ${product.createdAt ? `<div class="info-row"><label>Created:</label> <span>${new Date(product.createdAt).toLocaleDateString()}</span></div>` : ''}
                ${product.updatedAt ? `<div class="info-row"><label>Updated:</label> <span>${new Date(product.updatedAt).toLocaleDateString()}</span></div>` : ''}
            </div>
        </div>
    `;
};

// Edit product
window.editProduct = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('product-detail').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5>Edit Product</h5>
            </div>
            <div class="card-body">
                <form id="edit-product-form">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Product Name *</label>
                            <input type="text" class="form-control" id="edit-product-name" value="${product.name}" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Category</label>
                            <select class="form-select" id="edit-product-category"></select>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label class="form-label">Price *</label>
                            <input type="number" class="form-control" id="edit-product-price" step="0.01" value="${product.price}" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Discount</label>
                            <input type="number" class="form-control" id="edit-product-discount" min="0" value="${product.discount || 0}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Discount Type</label>
                            <select class="form-select" id="edit-product-discount-type">
                                <option value="percentage" ${product.discountType === 'percentage' ? 'selected' : ''}>Percentage</option>
                                <option value="fixed" ${product.discountType === 'fixed' ? 'selected' : ''}>Fixed Amount</option>
                            </select>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <span class="form-label d-block">Final Price (Inc. Tax)</span>
                            <span class="h5 text-success" id="edit-product-final-price">Final: ₹0.00</span>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">VAT %</label>
                            <select class="form-select" id="edit-product-vat"></select>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Stock</label>
                            <input type="number" class="form-control" id="edit-product-stock" value="${product.stock || 0}">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Min Stock</label>
                            <input type="number" class="form-control" id="edit-product-min-stock" value="${product.minStock || 0}">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Product Images</label>
                        <input type="file" class="form-control" id="edit-product-images" accept="image/*" multiple>
                        <div class="mt-2" id="edit-product-image-preview"></div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="edit-product-description" rows="3">${product.description || ''}</textarea>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-3">
                            <label class="form-label">Brand</label>
                            <select class="form-select" id="edit-product-brand"></select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Color</label>
                            <select class="form-select" id="edit-product-color"></select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Size</label>
                            <select class="form-select" id="edit-product-size"></select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Unit</label>
                            <select class="form-select" id="edit-product-unit"></select>
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <button onclick="addStock('${productId}')" class="btn btn-success" style="height: 38px; flex: 1;">
                            <i class="fas fa-plus"></i> Stock
                        </button>
                        <button onclick="deleteProduct('${productId}')" class="btn btn-danger" style="height: 38px; flex: 1;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                    <div class="d-flex gap-2 mt-2">
                        <button type="button" class="btn btn-secondary" onclick="selectProduct('${productId}')" style="height: 38px; flex: 1;">Cancel</button>
                        <button type="submit" class="btn btn-primary" style="height: 38px; flex: 1;">Update</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Populate dropdowns with current values
    populateDropdown('edit-product-category', productAttributes.categories, product.category);
    populateDropdown('edit-product-brand', productAttributes.brands, product.brand);
    populateDropdown('edit-product-color', productAttributes.colors, product.color);
    populateDropdown('edit-product-size', productAttributes.sizes, product.size);
    populateDropdown('edit-product-unit', productAttributes.units, product.unit);
    populateDropdown('edit-product-vat', productAttributes.vatRates, product.vat);
    
    // Setup image preview with existing images
    if (product.images && product.images.length > 0) {
        showExistingImages(product.images, 'edit-product-image-preview');
    }
    
    document.getElementById('edit-product-images').addEventListener('change', function() {
        previewImages(this, 'edit-product-image-preview');
    });
    
    // Setup price calculation
    setTimeout(() => {
        setupPriceCalculation('edit-product-price', 'edit-product-discount', 'edit-product-discount-type', 'edit-product-final-price');
    }, 100);
    
    document.getElementById('edit-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            await updateDoc(doc(db, 'products', productId), {
                name: document.getElementById('edit-product-name').value,
                price: parseFloat(document.getElementById('edit-product-price').value),
                discount: parseFloat(document.getElementById('edit-product-discount').value) || 0,
                discountType: document.getElementById('edit-product-discount-type').value,
                stock: parseInt(document.getElementById('edit-product-stock').value) || 0,
                minStock: parseInt(document.getElementById('edit-product-min-stock').value) || 0,
                category: document.getElementById('edit-product-category').value,
                description: document.getElementById('edit-product-description').value,
                brand: document.getElementById('edit-product-brand').value,
                color: document.getElementById('edit-product-color').value,
                size: document.getElementById('edit-product-size').value,
                unit: document.getElementById('edit-product-unit').value,
                vat: parseFloat(document.getElementById('edit-product-vat').value) || 0,
                images: window.editUploadedImages || product.images || [],
                updatedAt: new Date().toISOString()
            });
            
            showToast('Product updated successfully!', 'success');
            setTimeout(() => selectProduct(productId), 1500);
        } catch (error) {
            showToast('Error updating product: ' + error.message, 'error');
        }
    });
};

// Add stock
window.addStock = async function(productId) {
    const amount = prompt('Enter stock amount to add:');
    if (amount && !isNaN(amount)) {
        try {
            const product = products.find(p => p.id === productId);
            const newStock = (product.stock || 0) + parseInt(amount);
            
            await updateDoc(doc(db, 'products', productId), {
                stock: newStock,
                updatedAt: new Date().toISOString()
            });
            
            showToast(`Added ${amount} stock successfully!`, 'success');
            selectProduct(productId); // Refresh product details
        } catch (error) {
            console.error('Error adding stock:', error);
            showToast('Error adding stock: ' + error.message, 'error');
        }
    }
};

// Delete product
window.deleteProduct = async function(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await deleteDoc(doc(db, 'products', productId));
            showToast('Product deleted successfully!', 'success');
            
            // Clear product detail view
            document.getElementById('product-detail').innerHTML = `
                <div class="card-body text-center py-5">
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Select a product to view details</h5>
                </div>
            `;
        } catch (error) {
            console.error('Error deleting product:', error);
            showToast('Error deleting product: ' + error.message, 'error');
        }
    }
};

// Show add product form
function showAddProduct() {
    document.getElementById('product-detail').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5>Add New Product</h5>
            </div>
            <div class="card-body">
                <form id="add-product-form">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Product Name *</label>
                            <input type="text" class="form-control" id="product-name" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Category</label>
                            <select class="form-select" id="product-category"></select>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label class="form-label">Price *</label>
                            <input type="number" class="form-control" id="product-price" step="0.01" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Discount</label>
                            <input type="number" class="form-control" id="product-discount" min="0" value="0">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Discount Type</label>
                            <select class="form-select" id="product-discount-type">
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed Amount</option>
                            </select>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <span class="form-label d-block">Final Price (Inc. Tax)</span>
                            <span class="h5 text-success" id="product-final-price">Final: ₹0.00</span>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">VAT %</label>
                            <select class="form-select" id="product-vat"></select>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Stock</label>
                            <input type="number" class="form-control" id="product-stock" value="0">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Min Stock</label>
                            <input type="number" class="form-control" id="product-min-stock" value="0">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Product Images</label>
                        <input type="file" class="form-control" id="product-images" accept="image/*" multiple>
                        <div class="mt-2" id="product-image-preview"></div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="product-description" rows="3"></textarea>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-3">
                            <label class="form-label">Brand</label>
                            <select class="form-select" id="product-brand"></select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Color</label>
                            <select class="form-select" id="product-color"></select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Size</label>
                            <select class="form-select" id="product-size"></select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Unit</label>
                            <select class="form-select" id="product-unit"></select>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary me-2">Add Product</button>
                    <button type="button" class="btn btn-secondary" onclick="location.reload()">Cancel</button>
                </form>
            </div>
        </div>
    `;
    
    // Populate dropdowns
    populateDropdown('product-category', productAttributes.categories);
    populateDropdown('product-brand', productAttributes.brands);
    populateDropdown('product-color', productAttributes.colors);
    populateDropdown('product-size', productAttributes.sizes);
    populateDropdown('product-unit', productAttributes.units);
    populateDropdown('product-vat', productAttributes.vatRates);
    
    // Setup image preview
    document.getElementById('product-images').addEventListener('change', function() {
        previewImages(this, 'product-image-preview');
    });
    
    // Setup price calculation
    setTimeout(() => {
        setupPriceCalculation('product-price', 'product-discount', 'product-discount-type', 'product-final-price');
    }, 100);
    
    document.getElementById('add-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            await addDoc(collection(db, 'products'), {
                name: document.getElementById('product-name').value,
                price: parseFloat(document.getElementById('product-price').value),
                discount: parseFloat(document.getElementById('product-discount').value) || 0,
                discountType: document.getElementById('product-discount-type').value,
                stock: parseInt(document.getElementById('product-stock').value) || 0,
                minStock: parseInt(document.getElementById('product-min-stock').value) || 0,
                category: document.getElementById('product-category').value,
                description: document.getElementById('product-description').value,
                brand: document.getElementById('product-brand').value,
                color: document.getElementById('product-color').value,
                size: document.getElementById('product-size').value,
                unit: document.getElementById('product-unit').value,
                vat: parseFloat(document.getElementById('product-vat').value) || 0,
                images: window.uploadedImages || [],
                createdAt: new Date().toISOString()
            });
            
            showToast('Product added successfully!', 'success');
            setTimeout(() => location.reload(), 1500);
        } catch (error) {
            showToast('Error adding product: ' + error.message, 'error');
        }
    });
}

// Image handling functions
window.uploadedImages = [];
window.editUploadedImages = [];

function previewImages(input, previewId) {
    const preview = document.getElementById(previewId);
    const isEdit = previewId.includes('edit');
    
    if (input.files && input.files.length > 0) {
        Array.from(input.files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = e.target.result;
                
                if (isEdit) {
                    if (!window.editUploadedImages) window.editUploadedImages = [];
                    window.editUploadedImages.push(imageData);
                } else {
                    if (!window.uploadedImages) window.uploadedImages = [];
                    window.uploadedImages.push(imageData);
                }
                
                updateImagePreview(previewId, isEdit ? window.editUploadedImages : window.uploadedImages);
            };
            reader.readAsDataURL(file);
        });
    }
}

function showExistingImages(images, previewId) {
    window.editUploadedImages = [...images];
    updateImagePreview(previewId, window.editUploadedImages);
}

function updateImagePreview(previewId, images) {
    const preview = document.getElementById(previewId);
    if (!preview) return;
    
    preview.innerHTML = '';
    
    images.forEach((imageSrc, index) => {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'd-inline-block position-relative me-2 mb-2';
        imageDiv.innerHTML = `
            <img src="${imageSrc}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">
            <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0" 
                    onclick="removeImage(${index}, '${previewId}')" style="width: 20px; height: 20px; padding: 0; font-size: 10px;">
                <i class="fas fa-times"></i>
            </button>
        `;
        preview.appendChild(imageDiv);
    });
}

window.removeImage = function(index, previewId) {
    const isEdit = previewId.includes('edit');
    
    if (isEdit) {
        window.editUploadedImages.splice(index, 1);
        updateImagePreview(previewId, window.editUploadedImages);
    } else {
        window.uploadedImages.splice(index, 1);
        updateImagePreview(previewId, window.uploadedImages);
    }
};

// Toast notification function
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.getElementById('custom-toast');
    if (existingToast) existingToast.remove();
    
    // Create toast
    const toast = document.createElement('div');
    toast.id = 'custom-toast';
    toast.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} position-fixed`;
    toast.style.cssText = `
        top: 80px;
        right: 20px;
        z-index: 10000;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border-radius: 8px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    toast.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
            <span>${message}</span>
            <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Debug function
window.debugProducts = () => {
    console.log('Products array:', products);
    console.log('Grid element:', document.getElementById('products-grid'));
    console.log('Firebase db:', db);
};