// Products Loader for Index Page
import { db } from './firebase-config.js';
import { collection, getDocs, onSnapshot, doc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

let products = [];

// Initialize products loading
document.addEventListener('DOMContentLoaded', () => {
    loadCurrency();
    loadProducts();
    loadHeroProducts();
});

// Load currency setting
function loadCurrency() {
    try {
        onSnapshot(doc(db, 'settings', 'currency'), (doc) => {
            if (doc.exists()) {
                window.storeCurrency = doc.data().symbol || '₹';
            } else {
                window.storeCurrency = '₹';
            }
            // Re-render products if currency changes
            if (products.length > 0) {
                renderProducts();
            }
        });
    } catch (error) {
        console.error('Error loading currency:', error);
        window.storeCurrency = '₹';
    }
}

// Load products with real-time updates
async function loadProducts() {
    try {
        // First try to get products once
        const querySnapshot = await getDocs(collection(db, 'products'));
        products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        renderProducts();
        
        // Then set up real-time listener
        onSnapshot(collection(db, 'products'), (querySnapshot) => {
            products = [];
            querySnapshot.forEach((doc) => {
                products.push({ id: doc.id, ...doc.data() });
            });
            renderProducts();
        });
    } catch (error) {
        console.error('Error loading products:', error);
        const grid = document.getElementById('products-grid');
        if (grid) {
            grid.innerHTML = '<div class="col-12 text-center"><p>Unable to load products. Please refresh the page.</p></div>';
        }
    }
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

// Get stock status text with Bootstrap classes
function getStockStatus(product) {
    const stock = product.stock || 0;
    const minStock = product.minStock || 0;
    
    if (stock === 0) {
        return '<span class="badge bg-danger">OUT OF STOCK</span>';
    } else if (minStock > 0 && stock <= minStock) {
        return `<span class="badge bg-warning text-dark">${stock} REMAINING</span>`;
    } else {
        return '<span class="badge bg-success">IN STOCK</span>';
    }
}

// Render products
function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    if (products.length === 0) {
        grid.innerHTML = '<p>No products available.</p>';
        return;
    }
    
    grid.innerHTML = products.map(product => {
        const firstImage = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300x200';
        const finalPrice = calculateFinalPrice(product.price, product.discount, product.discountType);
        const isOutOfStock = (product.stock || 0) === 0;
        
        return `
            <div class="col-xl-2 col-lg-3 col-md-4 col-6 mb-4">
                <div class="card h-100 ${isOutOfStock ? 'opacity-75' : ''}" style="cursor: pointer;" onclick="openProductDetails('${product.id}')">
                    ${product.discount ? `<div class="position-absolute top-0 start-0 bg-danger text-white px-2 py-1 rounded-end" style="z-index: 1;">${product.discount}${product.discountType === 'percentage' ? '%' : window.storeCurrency || '₹'} OFF</div>` : ''}
                    <img src="${firstImage}" class="card-img-top" alt="${product.name}" style="height: 200px; object-fit: contain; background: white; padding: 15px 10px 10px 10px;">
                    <div class="card-body d-flex flex-column text-center p-2">
                        <div style="height: 2.5rem; display: flex; align-items: flex-start; justify-content: center; line-height: 1.1; font-size: 0.85rem; font-weight: 600;">${product.name}</div>
                        <div style="height: 1rem; display: flex; align-items: center; justify-content: center;">
                            ${product.discount ? `<small class="text-muted text-decoration-line-through">${window.storeCurrency || '₹'}${product.price}</small>` : ''}
                        </div>
                        <div style="height: 1.2rem; display: flex; align-items: center; justify-content: center;">
                            <span class="text-primary fw-bold" style="font-size: 0.9rem;">${window.storeCurrency || '₹'}${finalPrice.toFixed(2)}</span>
                        </div>
                        <div style="height: 1.2rem; display: flex; align-items: center; justify-content: center; margin-bottom: 0.3rem;">
                            ${getStockStatus(product)}
                        </div>
                        <div class="mt-auto">
                            <button class="btn ${isOutOfStock ? 'btn-secondary' : 'btn-primary'} w-100 btn-sm" ${isOutOfStock ? 'disabled' : ''} onclick="event.stopPropagation(); addToCart('${product.id}')">
                                ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

let heroProductsData = [];
let currentHeroIndex = 0;
let currentImageIndex = 0;
let heroSliderInterval;

// Load hero products
function loadHeroProducts() {
    try {
        onSnapshot(collection(db, 'products'), (querySnapshot) => {
            heroProductsData = [];
            querySnapshot.forEach((doc) => {
                const product = doc.data();
                if (product.heroBanner) {
                    heroProductsData.push({ id: doc.id, ...product });
                }
            });
            startHeroSlider();
        });
    } catch (error) {
        console.error('Error loading hero products:', error);
    }
}



// Start hero slider
function startHeroSlider() {
    if (heroProductsData.length === 0) return;
    showHeroProduct();
}

// Show current hero product
function showHeroProduct() {
    const slider = document.getElementById('hero-product-slider');
    const indicators = document.getElementById('carousel-indicators');
    if (!slider || heroProductsData.length === 0) return;
    
    // Create carousel items
    slider.innerHTML = heroProductsData.map((product, index) => {
        const finalPrice = calculateFinalPrice(product.price, product.discount, product.discountType);
        const isOutOfStock = (product.stock || 0) === 0;
        const productImage = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/800x400';
        
        return `
            <div class="carousel-item ${index === 0 ? 'active' : ''}">
                <div class="container h-100">
                    <div class="row h-100 align-items-center">
                        <div class="col-6 text-start">
                            ${product.discount ? `<span class="badge bg-danger mb-3 fs-6">${product.discount}${product.discountType === 'percentage' ? '%' : window.storeCurrency || '₹'} OFF</span>` : ''}
                            <h2 class="fw-bold mb-3">${product.name}</h2>
                            <div class="mb-4">
                                ${product.discount ? `<span class="text-muted text-decoration-line-through me-2 fs-5">${window.storeCurrency || '₹'}${product.price}</span>` : ''}
                                <span class="h3 fw-bold text-primary">${window.storeCurrency || '₹'}${finalPrice.toFixed(2)}</span>
                            </div>
                            <button class="btn ${isOutOfStock ? 'btn-secondary' : 'btn-primary'} btn-lg" ${isOutOfStock ? 'disabled' : ''} onclick="addToCart('${product.id}')">
                                <i class="fas fa-shopping-cart me-2"></i>${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                        </div>
                        <div class="col-6 text-center">
                            <div class="hero-product-container">
                                <img src="${productImage}" alt="${product.name}" class="img-fluid">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Create indicators
    indicators.innerHTML = heroProductsData.map((_, index) => 
        `<button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="${index}" ${index === 0 ? 'class="active"' : ''}></button>`
    ).join('');
}

// Open product details
window.openProductDetails = function(productId) {
    window.location.href = `product-details.html?id=${productId}`;
};

// Add to cart function
window.addToCart = async function(productId) {
    const product = products.find(p => p.id === productId);
    if (product && (product.stock || 0) > 0) {
        // Import and use the cart module
        const { addToCart } = await import('./cart.js');
        const finalPrice = calculateFinalPrice(product.price, product.discount, product.discountType);
        
        addToCart({
            id: product.id,
            name: product.name,
            price: finalPrice,
            originalPrice: product.price,
            discount: product.discount || 0,
            discountType: product.discountType,
            vat: product.vat || 0,
            unit: product.unit || 'pcs',
            image: product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300x200'
        });
    }
};