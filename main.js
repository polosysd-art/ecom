// Main JavaScript - DO NOT EDIT
import { getProducts } from './database.js';
import { addToCart, getCart } from './cart.js';
import { onAuthChange } from './auth.js';

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    updateCartCount();
    setupAuthState();
    await loadFeaturedProducts();
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
    // Auth UI is now handled by navigation.js
}

// Load featured products
async function loadFeaturedProducts() {
    try {
        const products = await getProducts();
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
                        addToCart(product);
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
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const img = document.createElement('img');
    img.src = product.image || 'https://via.placeholder.com/250x200';
    img.alt = product.name || '';
    
    const title = document.createElement('h3');
    title.textContent = product.name || '';
    
    const desc = document.createElement('p');
    desc.textContent = product.description || '';
    
    const price = document.createElement('div');
    price.className = 'price';
    const priceValue = isNaN(product.price) ? 0 : parseFloat(product.price);
    price.textContent = `$${priceValue.toFixed(2)}`;
    
    const button = document.createElement('button');
    button.className = 'btn add-to-cart';
    button.dataset.productId = product.id;
    button.textContent = 'Add to Cart';
    
    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(price);
    card.appendChild(button);
    
    return card.outerHTML;
}

// Export for use in other files
window.updateCartCount = updateCartCount;