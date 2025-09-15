// Shopping Cart Functions - DO NOT EDIT
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Add item to cart
export function addToCart(product) {
  const existingItem = cart.find(item => item.id === product.id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  
  saveCart();
  updateCartDisplay();
  showCartMessage('✓ Added to cart!');
}

// Show cart message
function showCartMessage(message) {
  const existing = document.querySelector('.cart-message');
  if (existing) existing.remove();
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'cart-message';
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 80px;
    right: -200px;
    padding: 8px 12px;
    z-index: 10000;
    font-weight: 500;
    background: #27ae60;
    color: white;
    font-size: 12px;
    border-radius: 4px;
    transition: right 0.3s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  
  document.body.appendChild(messageDiv);
  
  // Slide in
  setTimeout(() => {
    messageDiv.style.right = '20px';
  }, 10);
  
  // Slide out and remove
  setTimeout(() => {
    messageDiv.style.right = '-200px';
    setTimeout(() => messageDiv.remove(), 300);
  }, 2000);
}

// Remove item from cart
export function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCartDisplay();
}

// Update quantity
export function updateQuantity(productId, quantity) {
  const item = cart.find(item => item.id === productId);
  if (item) {
    item.quantity = Math.max(0, quantity);
    if (item.quantity === 0) {
      removeFromCart(productId);
    } else {
      saveCart();
      updateCartDisplay();
    }
  }
}

// Get cart items
export function getCart() {
  // Reload from localStorage to ensure fresh data
  cart = JSON.parse(localStorage.getItem('cart')) || [];
  console.log('Getting cart from localStorage:', cart);
  console.log('localStorage cart raw:', localStorage.getItem('cart'));
  return cart;
}

// Get cart total
export function getCartTotal() {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Clear cart
export function clearCart() {
  cart = [];
  saveCart();
  updateCartDisplay();
}

// Save cart to localStorage
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Update cart display
function updateCartDisplay() {
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'inline' : 'none';
  }
  
  // Update all cart count elements
  const cartCounts = document.querySelectorAll('.cart-count');
  cartCounts.forEach(el => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    el.textContent = totalItems;
    el.style.display = totalItems > 0 ? 'inline' : 'none';
  });
  
  // Also update via navigation if available
  if (window.navigation && window.navigation.updateCartCount) {
    window.navigation.updateCartCount();
  }
}