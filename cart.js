// Shopping Cart Functions - Updated for Cart Manager

// Add item to cart
export async function addToCart(product) {
  console.log('=== ADD TO CART DEBUG ===');
  console.log('Product:', product);
  console.log('window.cartManager exists:', !!window.cartManager);
  
  if (window.cartManager) {
    console.log('Using cart manager');
    console.log('Current user:', window.cartManager.currentUser);
    console.log('Temp cart before:', window.cartManager.tempCart);
    
    await window.cartManager.addToCart(product);
    
    console.log('Temp cart after:', window.cartManager.tempCart);
    showCartMessage('✓ Added to cart!');
  } else {
    console.log('No cart manager, using localStorage fallback');
    // Fallback to localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('Saved to localStorage:', cart);
    updateCartDisplay();
    showCartMessage('✓ Added to cart!');
  }
  console.log('=== ADD TO CART DEBUG END ===');
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
export async function removeFromCart(productId) {
  if (window.cartManager) {
    await window.cartManager.removeFromCart(productId);
  } else {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
  }
}

// Update quantity
export async function updateQuantity(productId, quantity) {
  if (window.cartManager) {
    await window.cartManager.updateQuantity(productId, quantity);
  } else {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart.find(item => item.id === productId);
    if (item) {
      item.quantity = Math.max(0, quantity);
      if (item.quantity === 0) {
        await removeFromCart(productId);
      } else {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
      }
    }
  }
}

// Get cart items
export async function getCart() {
  if (window.cartManager) {
    return await window.cartManager.getCart();
  } else {
    return JSON.parse(localStorage.getItem('cart')) || [];
  }
}

// Get cart total
export async function getCartTotal() {
  const cart = await getCart();
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Clear cart
export async function clearCart() {
  if (window.cartManager) {
    await window.cartManager.clearCart();
  } else {
    localStorage.removeItem('cart');
    updateCartDisplay();
  }
}

// Update cart display
async function updateCartDisplay() {
  if (window.cartManager) {
    await window.cartManager.updateCartCount();
  } else {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCounts = document.querySelectorAll('.cart-count');
    cartCounts.forEach(el => {
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      el.textContent = totalItems;
      el.style.display = totalItems > 0 ? 'inline' : 'none';
    });
  }
}