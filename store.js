// Store Page JavaScript - DO NOT EDIT
import { getProducts } from './database.js';
import { addToCart, getCart } from './cart.js';
import { onAuthChange, logOut } from './auth.js';



let currentUser = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    updateCartCount();
    setupAuthState();
    await loadFeaturedProducts();
    
    // Setup global real-time listeners
    try {
        const { setupGlobalListeners } = await import('./database.js');
        setupGlobalListeners();
    } catch (error) {
        console.log('Global listeners not available');
    }
    
    // Hide page loading after all data is loaded
    if (window.navigation) {
        setTimeout(() => {
            window.navigation.hidePageLoading();
        }, 300);
    }
});

// Update cart count in navigation
function updateCartCount() {
    const cart = getCart();
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

// Setup authentication state - handled by navigation.js
function setupAuthState() {
    onAuthChange((user) => {
        currentUser = user;
        // Auth UI is handled by navigation.js
    });
}

// Load featured products with real-time updates
function loadFeaturedProducts() {
    try {
        // Use real-time listener for products
        const { onSnapshot, collection } = window.firebaseModules || {};
        if (onSnapshot && collection) {
            onSnapshot(collection(window.db, 'products'), (querySnapshot) => {
                const products = [];
                querySnapshot.forEach((doc) => {
                    products.push({ id: doc.id, ...doc.data() });
                });
                
                const featuredGrid = document.getElementById('featured-grid');
        
                if (featuredGrid && products.length > 0) {
                    // Show first 4 products as featured
                    const featured = products.slice(0, 4);
                    featuredGrid.innerHTML = featured.map(product => createProductCard(product)).join('');
                    
                    // Add event listeners for add to cart buttons
                    featuredGrid.addEventListener('click', (e) => {
                        if (e.target.classList.contains('add-to-cart')) {
                            const productId = e.target.dataset.productId;
                            const product = featured.find(p => p.id === productId);
                            if (product) {
                                addToCart({
                                    id: product.id,
                                    name: product.name,
                                    price: product.price,
                                    originalPrice: product.originalPrice || product.price,
                                    discount: product.discount || 0,
                                    discountType: product.discountType,
                                    vat: product.vat || 0,
                                    unit: product.unit || 'pcs',
                                    image: product.image
                                });
                                updateCartCount();
                                e.target.textContent = 'Added!';
                                setTimeout(() => {
                                    e.target.textContent = 'Add to Cart';
                                }, 1000);
                            }
                        }
                    });
                } else {
                    // Fallback to regular loading
                    loadProductsRegular();
                }
            });
        } else {
            // Fallback to regular loading
            loadProductsRegular();
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Fallback regular loading
async function loadProductsRegular() {
    try {
        const products = await getProducts();
        const featuredGrid = document.getElementById('featured-grid');
        
        if (featuredGrid && products.length > 0) {
            const featured = products.slice(0, 4);
            featuredGrid.innerHTML = featured.map(product => createProductCard(product)).join('');
            
            featuredGrid.addEventListener('click', (e) => {
                if (e.target.classList.contains('add-to-cart')) {
                    const productId = e.target.dataset.productId;
                    const product = featured.find(p => p.id === productId);
                    if (product) {
                        addToCart({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            originalPrice: product.originalPrice || product.price,
                            discount: product.discount || 0,
                            discountType: product.discountType,
                            vat: product.vat || 0,
                            unit: product.unit || 'pcs',
                            image: product.image
                        });
                        updateCartCount();
                        e.target.textContent = 'Added!';
                        setTimeout(() => {
                            e.target.textContent = 'Add to Cart';
                        }, 1000);
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Create product card HTML
function createProductCard(product) {
    return `
        <div class="product-card">
            <img src="${product.image || 'https://via.placeholder.com/250x200'}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="price">$${product.price.toFixed(2)}</div>
            <button class="btn add-to-cart" data-product-id="${product.id}">Add to Cart</button>
        </div>
    `;
}

// Export for use in other files
window.updateCartCount = updateCartCount;