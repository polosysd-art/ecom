// Products Loader for Index Page
import { db } from '../config/firebase-config.js';
import { collection, getDocs, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

let products = [];

// Initialize products loading
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});

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

// Get stock status text with color class
function getStockStatus(product) {
    const stock = product.stock || 0;
    const minStock = product.minStock || 0;
    
    if (stock === 0) {
        return '<span class="stock-out">OUT OF STOCK</span>';
    } else if (minStock > 0 && stock <= minStock) {
        return `<span class="stock-low">${stock} REMAINING</span>`;
    } else {
        return '<span class="stock-in">IN STOCK</span>';
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
            <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}">
                ${product.discount ? `<div class="discount-badge">${product.discount}${product.discountType === 'percentage' ? '%' : '₹'} OFF</div>` : ''}
                <div class="product-image">
                    <img src="${firstImage}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">
                        ${product.discount ? `<span class="original-price">₹${product.price}</span>` : ''}
                        <span class="final-price">₹${finalPrice.toFixed(2)}</span>
                    </div>
                    <div class="product-stock">${getStockStatus(product)}</div>
                    <button class="add-to-cart-btn" ${isOutOfStock ? 'disabled' : ''} onclick="addToCart('${product.id}')">
                        ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

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
            image: product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300x200'
        });
    }
};