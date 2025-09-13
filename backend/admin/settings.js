// Admin Settings Management
import { db, auth } from '../../frontend/config/firebase-config.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// Initialize settings
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupSettingsForm();
});

// Load current settings
async function loadSettings() {
    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'store'));
        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            
            // Populate form fields
            document.getElementById('store-name').value = data.storeName || '';
            document.getElementById('store-description').value = data.storeDescription || '';
            document.getElementById('store-email').value = data.storeEmail || '';
            document.getElementById('store-phone').value = data.storePhone || '';
            document.getElementById('store-address').value = data.storeAddress || '';
            document.getElementById('store-logo').value = data.storeLogo || '';
            document.getElementById('currency').value = data.currency || 'USD';
            document.getElementById('hero-title').value = data.heroTitle || '';
            document.getElementById('hero-subtitle').value = data.heroSubtitle || '';
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Setup settings form
function setupSettingsForm() {
    const form = document.getElementById('settings-form');
    if (form) {
        form.addEventListener('submit', handleSettingsSave);
    }
}

// Handle settings save
async function handleSettingsSave(e) {
    e.preventDefault();
    
    const formData = {
        storeName: document.getElementById('store-name').value,
        storeDescription: document.getElementById('store-description').value,
        storeEmail: document.getElementById('store-email').value,
        storePhone: document.getElementById('store-phone').value,
        storeAddress: document.getElementById('store-address').value,
        storeLogo: document.getElementById('store-logo').value,
        currency: document.getElementById('currency').value,
        heroTitle: document.getElementById('hero-title').value,
        heroSubtitle: document.getElementById('hero-subtitle').value,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || 'admin'
    };
    
    try {
        await setDoc(doc(db, 'settings', 'store'), formData);
        
        // Update navigation immediately
        if (window.navigation) {
            window.navigation.updateStoreName(formData.storeName || 'Store');
            window.navigation.updatePageTexts(formData);
        }
        
        showSettingsMessage('Settings saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showSettingsMessage('Error saving settings', 'error');
    }
}

// Show settings message
function showSettingsMessage(message, type) {
    // Remove existing message
    const existingMessage = document.querySelector('.settings-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `settings-message ${type}`;
    messageDiv.textContent = message;
    
    // Add styles
    messageDiv.style.cssText = `
        padding: 10px;
        margin: 10px 0;
        border-radius: 4px;
        ${type === 'success' ? 
            'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 
            'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
        }
    `;
    
    // Insert after form
    const form = document.getElementById('settings-form');
    form.parentNode.insertBefore(messageDiv, form.nextSibling);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}