// Page Settings Management
import { db, auth, storage } from '../../frontend/config/firebase-config.js';
import { doc, getDoc, setDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';

// Toggle section function
window.toggleSection = function(sectionId) {
    const content = document.getElementById(sectionId);
    const header = content.previousElementSibling;
    
    content.classList.toggle('expanded');
    header.classList.toggle('expanded');
}

// Initialize page settings
document.addEventListener('DOMContentLoaded', () => {
    loadPageSettings();
    setupSaveButton();
    loadOrdersForManagement();
    setupDeleteOrderButton();
});

// Load current page settings with real-time updates
function loadPageSettings() {
    try {
        onSnapshot(doc(db, 'settings', 'pages'), (settingsDoc) => {
            if (settingsDoc.exists()) {
                const data = settingsDoc.data();
            
            // Home Page
            document.getElementById('hero-title').value = data.heroTitle || '';
            document.getElementById('hero-subtitle').value = data.heroSubtitle || '';
            document.getElementById('hero-description').value = data.heroDescription || '';
            // Display current images (if any)
            updateImagePreviews(data);

            document.getElementById('hero-text-visible').checked = data.heroTextVisible !== false;
            document.getElementById('hero-text-padding').value = data.heroTextPadding || '';
            document.getElementById('hero-text-margin').value = data.heroTextMargin || '';
            document.getElementById('animated-title').value = data.animatedTitle || 'CYBEE CART';
            document.getElementById('header-font').value = data.headerFont || 'Arial, sans-serif';
            
            // Products Page
            document.getElementById('products-title').value = data.productsTitle || '';
            document.getElementById('products-subtitle').value = data.productsSubtitle || '';
            document.getElementById('no-products-message').value = data.noProductsMessage || '';
            
            // Cart Page
            document.getElementById('cart-title').value = data.cartTitle || '';
            document.getElementById('empty-cart-message').value = data.emptyCartMessage || '';
            document.getElementById('checkout-button-text').value = data.checkoutButtonText || '';
            
            // Login Page
            document.getElementById('login-title').value = data.loginTitle || '';
            document.getElementById('login-subtitle').value = data.loginSubtitle || '';
            document.getElementById('signup-prompt').value = data.signupPrompt || '';
            
            // Order Settings
            document.getElementById('order-prefix').value = data.orderPrefix || 'ORD';
            }
        });
    } catch (error) {
        console.error('Error loading page settings:', error);
    }
}

// Setup save button
function setupSaveButton() {
    const saveButton = document.getElementById('save-all-settings');
    if (saveButton) {
        saveButton.addEventListener('click', handleSaveSettings);
    }
}

// Handle settings save
async function handleSaveSettings() {
    const saveButton = document.getElementById('save-all-settings');
    const originalText = saveButton.textContent;
    
    console.log('Save button clicked');
    
    try {
        // Show loading state
        saveButton.textContent = 'Saving...';
        saveButton.disabled = true;
        
        const formData = {
            // Home Page
            heroTitle: document.getElementById('hero-title').value,
            heroSubtitle: document.getElementById('hero-subtitle').value,
            heroDescription: document.getElementById('hero-description').value,
            heroTextVisible: document.getElementById('hero-text-visible').checked,


            heroTextPadding: document.getElementById('hero-text-padding').value,
            heroTextMargin: document.getElementById('hero-text-margin').value,
            animatedTitle: document.getElementById('animated-title').value,
            headerFont: document.getElementById('header-font').value,
            
            // Products Page
            productsTitle: document.getElementById('products-title').value,
            productsSubtitle: document.getElementById('products-subtitle').value,
            noProductsMessage: document.getElementById('no-products-message').value,
            
            // Cart Page
            cartTitle: document.getElementById('cart-title').value,
            emptyCartMessage: document.getElementById('empty-cart-message').value,
            checkoutButtonText: document.getElementById('checkout-button-text').value,
            
            // Login Page
            loginTitle: document.getElementById('login-title').value,
            loginSubtitle: document.getElementById('login-subtitle').value,
            signupPrompt: document.getElementById('signup-prompt').value,
            
            // Order Settings
            orderPrefix: document.getElementById('order-prefix').value,
            
            // Metadata
            updatedAt: new Date().toISOString(),
            updatedBy: auth.currentUser?.email || 'admin'
        };
        
        console.log('Saving data:', formData);
        await setDoc(doc(db, 'settings', 'pages'), formData);
        
        console.log('Save successful');
        showMessage('Page settings saved successfully!', 'success');
        
        // Clear uploaded images after successful save
        window.uploadedImages = {};
        
        // Reset button
        saveButton.textContent = originalText;
        saveButton.disabled = false;
        
    } catch (error) {
        console.error('Error saving page settings:', error);
        showMessage('Error saving page settings', 'error');
        
        // Reset button
        saveButton.textContent = originalText;
        saveButton.disabled = false;
    }
}

// Show message
function showMessage(message, type) {
    // Remove existing message
    const existingMessage = document.querySelector('.page-settings-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `page-settings-message ${type}`;
    messageDiv.textContent = message;
    
    // Add styles
    messageDiv.style.cssText = `
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
        font-weight: 500;
        ${type === 'success' ? 
            'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 
            'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
        }
    `;
    
    // Insert at top of container
    const container = document.querySelector('.page-settings-container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Remove after 4 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 4000);
}





// Update save button state
function updateSaveButtonState() {
    const saveButton = document.getElementById('save-all-settings');
    if (saveButton) {
        if (window.uploading > 0) {
            saveButton.disabled = true;
            saveButton.textContent = 'Uploading Images...';
            saveButton.classList.add('uploading');
        } else {
            saveButton.disabled = false;
            saveButton.textContent = 'Save All Page Settings';
            saveButton.classList.remove('uploading');
        }
    }
}

// Load orders for management
async function loadOrdersForManagement() {
    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        const querySnapshot = await getDocs(collection(db, 'orders'));
        
        const orderSelect = document.getElementById('order-select');
        orderSelect.innerHTML = '<option value="">Select an order to delete</option>';
        
        querySnapshot.forEach((doc) => {
            const order = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `Order #${order.orderNumber || doc.id.substring(0, 8)} - ${order.customerInfo.name} - ₹${order.total}`;
            orderSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('order-select').innerHTML = '<option value="">Error loading orders</option>';
    }
}

// Setup delete order button
function setupDeleteOrderButton() {
    const deleteBtn = document.getElementById('delete-order-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDeleteOrder);
    }
}

// Handle order deletion
async function handleDeleteOrder() {
    const orderSelect = document.getElementById('order-select');
    const orderId = orderSelect.value;
    
    if (!orderId) {
        showMessage('Please select an order to delete', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this order? This will restore product stock.')) {
        return;
    }
    
    try {
        const { doc, getDoc, updateDoc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        // Get order data to restore stock
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        const orderData = orderDoc.data();
        
        // Restore stock for each item
        for (const item of orderData.items) {
            if (!item.id) continue;
            
            try {
                const productRef = doc(db, 'products', item.id);
                const productDoc = await getDoc(productRef);
                
                if (productDoc.exists()) {
                    const currentStock = parseInt(productDoc.data().stock) || 0;
                    const restoreQuantity = parseInt(item.quantity) || 0;
                    const restoredStock = currentStock + restoreQuantity;
                    
                    await updateDoc(productRef, { stock: restoredStock });
                    console.log(`Stock restored for ${item.id}: ${currentStock} -> ${restoredStock}`);
                }
            } catch (error) {
                console.error('Error restoring stock for product:', item.id, error);
            }
        }
        
        // Delete the order
        await deleteDoc(doc(db, 'orders', orderId));
        
        showMessage('Order deleted and stock restored successfully!', 'success');
        loadOrdersForManagement(); // Reload orders list
        
    } catch (error) {
        console.error('Error deleting order:', error);
        showMessage('Error deleting order', 'error');
    }
}



