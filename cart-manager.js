// Firebase-based Cart Management System
class CartManager {
    constructor() {
        this.currentUser = null;
        this.tempCart = []; // Temporary cart for guests
        this.init();
    }

    init() {
        // Listen for auth changes
        if (window.navigation) {
            this.currentUser = window.navigation.currentUser;
        }
    }

    // Get cart items
    async getCart() {
        if (this.currentUser) {
            // Get cart from Firebase
            try {
                const { db } = await import('./firebase-config.js');
                const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
                
                const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
                if (userDoc.exists()) {
                    return userDoc.data().cart || [];
                }
            } catch (error) {
                console.log('Error loading cart from Firebase:', error);
            }
            return [];
        } else {
            // Get guest cart from localStorage
            const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
            this.tempCart = guestCart; // Sync with tempCart
            return guestCart;
        }
    }

    // Save cart items
    async saveCart(cart) {
        console.log('=== SAVE CART DEBUG ===');
        console.log('Current user:', this.currentUser);
        console.log('Cart to save:', cart);
        
        if (this.currentUser) {
            console.log('Saving to Firebase for user');
            // Save cart to Firebase
            try {
                const { db } = await import('./firebase-config.js');
                const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
                
                await setDoc(doc(db, 'users', this.currentUser.uid), { cart: cart }, { merge: true });
                console.log('Saved to Firebase successfully');
            } catch (error) {
                console.log('Error saving cart to Firebase:', error);
            }
        } else {
            console.log('Saving to localStorage for guest');
            // Save to localStorage for guests (persistent across reloads)
            this.tempCart = cart;
            localStorage.setItem('guest_cart', JSON.stringify(cart));
            console.log('Saved to localStorage guest_cart:', cart);
        }
        await this.updateCartCount();
        console.log('=== SAVE CART DEBUG END ===');
    }

    // Add item to cart
    async addToCart(product) {
        const cart = await this.getCart();
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        
        await this.saveCart(cart);
    }

    // Remove item from cart
    async removeFromCart(productId) {
        const cart = await this.getCart();
        const updatedCart = cart.filter(item => item.id !== productId);
        await this.saveCart(updatedCart);
    }

    // Update item quantity
    async updateQuantity(productId, quantity) {
        const cart = await this.getCart();
        const item = cart.find(item => item.id === productId);
        
        if (item) {
            if (quantity <= 0) {
                await this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                await this.saveCart(cart);
            }
        }
    }

    // Clear cart
    async clearCart() {
        if (this.currentUser) {
            await this.saveCart([]);
        } else {
            this.tempCart = [];
            localStorage.removeItem('guest_cart');
        }
        await this.updateCartCount();
    }

    // Update cart count in UI
    async updateCartCount() {
        const cartCountEl = document.querySelector('.cart-count');
        if (cartCountEl) {
            const cart = await this.getCart();
            const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            cartCountEl.textContent = totalItems;
            cartCountEl.style.display = totalItems > 0 ? 'inline' : 'none';
        }
    }

    // Update current user (called when auth state changes)
    async setCurrentUser(user) {
        const oldUser = this.currentUser;
        this.currentUser = user;
        
        if (user && !oldUser) {
            // User just logged in - always check for guest cart migration
            await this.migrateGuestCart();
        }
        
        await this.updateCartCount();
    }

    // Migrate guest cart to user cart on login
    async migrateGuestCart() {
        if (!this.currentUser) return;
        
        console.log('=== CART MIGRATION START ===');
        console.log('User logged in:', this.currentUser.uid);
        
        // 1. Get guest cart from localStorage
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
        console.log('Guest cart items:', guestCart.length);
        
        try {
            // 2. Load user's Firebase cart
            console.log('🔥 Loading Firebase modules...');
            const { db } = await import('./firebase-config.js');
            console.log('🔥 Firebase config loaded, db:', !!db);
            
            const { doc, getDoc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            console.log('🔥 Firestore functions loaded');
            
            console.log('🔥 Getting user document for UID:', this.currentUser.uid);
            const userDocRef = doc(db, 'users', this.currentUser.uid);
            console.log('🔥 User doc reference created:', userDocRef.path);
            
            const userDoc = await getDoc(userDocRef);
            console.log('🔥 User doc exists:', userDoc.exists());
            
            const userCart = userDoc.exists() ? (userDoc.data().cart || []) : [];
            console.log('🔥 User Firebase cart items:', userCart.length, userCart);
            
            // 3. Merge guest cart + user cart
            const mergedCart = [...userCart];
            guestCart.forEach(guestItem => {
                const existingItem = mergedCart.find(item => item.id === guestItem.id);
                if (existingItem) {
                    existingItem.quantity += guestItem.quantity;
                } else {
                    mergedCart.push(guestItem);
                }
            });
            
            console.log('Merged cart total items:', mergedCart.length);
            
            // 4. Save merged cart to Firebase
            console.log('🔥 Saving merged cart to Firebase...');
            console.log('🔥 Merged cart data:', mergedCart);
            
            const saveDocRef = doc(db, 'users', this.currentUser.uid);
            console.log('🔥 Save doc reference:', saveDocRef.path);
            
            await setDoc(saveDocRef, { cart: mergedCart }, { merge: true });
            console.log('✅ Successfully saved merged cart to Firebase');
            
            // Verify save by reading back
            const verifyDoc = await getDoc(saveDocRef);
            const savedCart = verifyDoc.exists() ? (verifyDoc.data().cart || []) : [];
            console.log('🔥 Verification - saved cart items:', savedCart.length);
            
            // 5. ONLY after successful save - clear local storage
            localStorage.removeItem('guest_cart');
            this.tempCart = [];
            console.log('✅ Cleared local guest cart');
            
            // 6. Update cart display
            await this.updateCartCount();
            if (window.location.pathname.includes('shopping-cart.html') && typeof displayCart === 'function') {
                setTimeout(() => displayCart(), 300);
            }
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            console.log('Guest cart preserved due to error');
        }
        
        console.log('=== CART MIGRATION END ===');
    }
}

// Create global cart manager instance
const cartManager = new CartManager();

// Export for use in other files
window.cartManager = cartManager;

export default cartManager;