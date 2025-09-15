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
        const unsubscribe = onSnapshot(doc(db, 'settings', 'pages'), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                window.storeCurrency = data.currency || '₹';
                // Re-render products if currency changes
                if (products.length > 0) {
                    renderProducts();
                }
            }
        });
    } catch (error) {
        console.error('Error loading currency:', error);
        window.storeCurrency = '₹';
    }
}

// Load products with real-time updates
function loadProducts() {
    try {
        const unsubscribe = onSnapshot(collection(db, 'products'), (querySnapshot) => {
            products = [];
            querySnapshot.forEach((doc) => {
                products.push({ id: doc.id, ...doc.data() });
            });
            renderProducts();
        }, (error) => {
            console.error('Error loading products:', error);
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
        onSnapshot(doc(db, 'settings', 'pages'), (settingsDoc) => {
            if (settingsDoc.exists()) {
                const heroProductIds = settingsDoc.data().heroProducts || [];
                if (heroProductIds.length > 0) {
                    loadSelectedHeroProducts(heroProductIds);
                }
            }
        });
    } catch (error) {
        console.error('Error loading hero products:', error);
    }
}

// Load selected hero products
function loadSelectedHeroProducts(heroProductIds) {
    onSnapshot(collection(db, 'products'), (querySnapshot) => {
        heroProductsData = [];
        querySnapshot.forEach((doc) => {
            if (heroProductIds.includes(doc.id)) {
                heroProductsData.push({ id: doc.id, ...doc.data() });
            }
        });
        startHeroSlider();
    });
}



// Start hero slider
function startHeroSlider() {
    if (heroProductsData.length === 0) return;
    
    clearInterval(heroSliderInterval);
    currentHeroIndex = 0;
    showHeroProduct();
    
    if (heroProductsData.length > 1) {
        heroSliderInterval = setInterval(() => {
            currentImageIndex++;
            if (currentImageIndex >= (heroProductsData[currentHeroIndex].images?.length || 1)) {
                currentImageIndex = 0;
                currentHeroIndex = (currentHeroIndex + 1) % heroProductsData.length;
            }
            showHeroProduct();
        }, 8000);
    }
}

// Show current hero product
function showHeroProduct() {
    const slider = document.getElementById('hero-product-slider');
    if (!slider) {
        console.log('Hero slider element not found');
        return;
    }
    if (heroProductsData.length === 0) {
        console.log('No hero products data available');
        return;
    }
    
    const product = heroProductsData[currentHeroIndex];
    console.log('Showing hero product:', product.name);
    
    // Cycle through product images
    const productImages = product.images && product.images.length > 0 ? product.images : ['https://via.placeholder.com/300x200'];
    const imageToShow = productImages[currentImageIndex % productImages.length];
    
    const finalPrice = calculateFinalPrice(product.price, product.discount, product.discountType);
    const isOutOfStock = (product.stock || 0) === 0;
    
    // Fixed animation selection
    const randomAnimation1 = 'hero-product-slide';
    const randomAnimation2 = 'hero-product-zoom';
    
    slider.innerHTML = `
        <div class="${randomAnimation1} w-100 d-flex align-items-center" style="background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); height: 360px;">
            <div class="d-flex w-100 hero-product-mobile" style="height: 360px;">
                <div class="d-flex align-items-center justify-content-center" style="background: white; width: 50%; height: 360px;">
                    ${product.discount ? `<div class="position-absolute top-0 start-0 bg-danger text-white px-3 py-1 rounded-end" style="z-index: 1;">${product.discount}${product.discountType === 'percentage' ? '%' : window.storeCurrency || '₹'} OFF</div>` : ''}
                    <img src="${imageToShow}" alt="${product.name}" style="max-width: 90%; max-height: 90%; object-fit: contain;">
                </div>
                <div class="d-flex align-items-center justify-content-center" style="width: 50%; height: 360px;">
                    <div class="text-center p-4">
                        <h2 class="mb-3">${product.name}</h2>
                        ${product.discount ? `<p class="text-muted text-decoration-line-through mb-2 fs-4">${window.storeCurrency || '₹'}${product.price}</p>` : ''}
                        <p class="text-primary fw-bold display-5 mb-4">${window.storeCurrency || '₹'}${finalPrice.toFixed(2)}</p>
                        <button class="btn ${isOutOfStock ? 'btn-secondary' : 'btn-primary'} btn-lg px-5 py-3" ${isOutOfStock ? 'disabled' : ''} onclick="addToCart('${product.id}')">
                            ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        

    `;
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