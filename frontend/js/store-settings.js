// Store Settings Loader - DO NOT EDIT
import { db } from '../config/firebase-config.js';
import { doc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

let storeSettings = {
    storeName: "Store",
    storeDescription: "Welcome to Our Store",
    currency: "USD"
};

// Load store settings with error handling
export function loadStoreSettings() {
    try {
        // Check if Firebase is available
        if (!db) {
            console.warn('Firebase not available, using default settings');
            updateStoreFrontend();
            return;
        }
        
        const settingsRef = doc(db, "settings", "store");
        
        // Try real-time listener first
        onSnapshot(settingsRef, (doc) => {
            if (doc.exists()) {
                storeSettings = { ...storeSettings, ...doc.data() };
            }
            updateStoreFrontend();
            
            // Force immediate update of navigation
            setTimeout(() => {
                const navLinks = document.querySelectorAll('h1 a');
                navLinks.forEach(link => {
                    if (!link.closest('.admin-header')) {
                        link.textContent = storeSettings.storeName;
                    }
                });
            }, 50);
        }, (error) => {
            console.error('Error listening to settings:', error);
            // Fallback to one-time read
            getDoc(settingsRef).then((doc) => {
                if (doc.exists()) {
                    storeSettings = { ...storeSettings, ...doc.data() };
                }
                updateStoreFrontend();
            }).catch((err) => {
                console.error('Fallback read failed:', err);
                // Use default settings
                updateStoreFrontend();
            });
        });
    } catch (error) {
        console.error('Error setting up settings listener:', error);
        // Always update frontend even if Firebase fails
        updateStoreFrontend();
    }
}

// Update frontend with store settings
function updateStoreFrontend() {
    // Update store name in navigation (all possible selectors)
    const storeElements = document.querySelectorAll('h1 a, .nav-container h1 a, h1');
    storeElements.forEach(element => {
        if (element && !element.closest('.admin-header')) {
            if (element.tagName === 'A') {
                element.textContent = storeSettings.storeName;
            } else if (element.tagName === 'H1' && element.querySelector('a')) {
                element.querySelector('a').textContent = storeSettings.storeName;
            }
        }
    });
    
    // Specifically target navigation store links
    const navStoreLinks = document.querySelectorAll('.nav-container h1 a[href*="store.html"], h1 a[href*="store.html"]');
    navStoreLinks.forEach(link => {
        link.textContent = storeSettings.storeName;
    });
    
    // Update page titles
    const pageTitle = document.querySelector('title');
    if (pageTitle && !pageTitle.textContent.includes('Admin')) {
        if (pageTitle.textContent.includes('Login')) {
            pageTitle.textContent = `Login - ${storeSettings.storeName}`;
        } else if (pageTitle.textContent.includes('Products')) {
            pageTitle.textContent = `Products - ${storeSettings.storeName}`;
        } else if (pageTitle.textContent.includes('Cart')) {
            pageTitle.textContent = `Shopping Cart - ${storeSettings.storeName}`;
        } else {
            pageTitle.textContent = storeSettings.storeName;
        }
    }
    
    // Update hero section
    const heroTitle = document.querySelector('.hero h2');
    if (heroTitle) {
        heroTitle.textContent = `Welcome to ${storeSettings.storeName}`;
    }
    
    const heroDescription = document.querySelector('.hero p');
    if (heroDescription && storeSettings.storeDescription) {
        heroDescription.textContent = storeSettings.storeDescription;
    }
    
    // Update footer
    const footer = document.querySelector('footer p');
    if (footer) {
        footer.innerHTML = `&copy; 2024 ${storeSettings.storeName}. All rights reserved.`;
    }
    
    // Force refresh navigation links
    setTimeout(() => {
        const navLinks = document.querySelectorAll('.nav-container h1 a');
        navLinks.forEach(link => {
            if (link) link.textContent = storeSettings.storeName;
        });
    }, 100);
}

// Get currency symbol
export function getCurrencySymbol() {
    const symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'INR': '₹'
    };
    return symbols[storeSettings.currency] || '$';
}

// Get store settings
export function getStoreSettings() {
    return storeSettings;
}

// Make globally available
window.getStoreSettings = getStoreSettings;

// Error handler to prevent site breaking
window.addEventListener('error', (e) => {
    console.error('JavaScript error:', e.error);
    // Continue loading site even if settings fail
    if (e.filename && e.filename.includes('store-settings')) {
        console.warn('Store settings failed, using defaults');
        updateStoreFrontend();
    }
});

// Auto-load on page load with real-time listener
document.addEventListener('DOMContentLoaded', () => {
    try {
        loadStoreSettings();
    } catch (error) {
        console.error('Failed to load store settings:', error);
        updateStoreFrontend();
    }
});

// Simple periodic update instead of MutationObserver
setInterval(() => {
    if (storeSettings.storeName) {
        const navLinks = document.querySelectorAll('h1 a');
        navLinks.forEach(link => {
            if (!link.closest('.admin-header') && link.textContent === 'Store') {
                link.textContent = storeSettings.storeName;
            }
        });
    }
}, 1000);