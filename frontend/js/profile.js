// Profile Management
import { db, auth } from '../config/firebase-config.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    setupAuth();
    setupForm();
    setupEditButton();
});

// Setup edit button
function setupEditButton() {
    document.getElementById('edit-profile-btn').addEventListener('click', () => {
        document.getElementById('profile-display').style.display = 'none';
        document.getElementById('profile-form').style.display = 'block';
        document.getElementById('edit-profile-btn').style.display = 'none';
    });
}

// Setup authentication
function setupAuth() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            loadProfile();
        } else {
            window.location.href = '../login.html';
        }
    });
}

// Load user profile
async function loadProfile() {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        
        // Display profile info
        displayProfile(userData);
        
        // Load form fields
        document.getElementById('user-name').value = userData.name || '';
        document.getElementById('user-email').value = currentUser.email;
        document.getElementById('user-phone').value = userData.phone || '';
        document.getElementById('user-address').value = userData.address || '';
        
        loadSavedAddresses(userData.addresses || []);
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Display profile information
function displayProfile(userData) {
    const display = document.getElementById('profile-display');
    display.innerHTML = `
        <div style="padding: 15px; background: #f9f9f9; border-radius: 6px; margin-bottom: 15px;">
            <p><strong>Name:</strong> ${userData.name || 'Not set'}</p>
            <p><strong>Email:</strong> ${currentUser.email}</p>
            <p><strong>Phone:</strong> ${userData.phone || 'Not set'}</p>
            <p><strong>Address:</strong> ${userData.address || 'Not set'}</p>
        </div>
    `;
}

// Load saved addresses
function loadSavedAddresses(addresses) {
    const container = document.getElementById('saved-addresses');
    if (addresses.length === 0) {
        container.innerHTML = '<p>No saved addresses</p>';
        return;
    }
    
    container.innerHTML = addresses.map((address, index) => `
        <div class="saved-address" style="padding: 10px; border: 1px solid #ddd; margin: 10px 0; border-radius: 4px;">
            <p style="margin: 0;">${address}</p>
            <button onclick="removeAddress(${index})" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;">Remove</button>
        </div>
    `).join('');
}

// Remove address
window.removeAddress = async function(index) {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        
        if (userData.addresses) {
            userData.addresses.splice(index, 1);
            await setDoc(doc(db, 'users', currentUser.uid), userData, { merge: true });
            loadSavedAddresses(userData.addresses);
        }
    } catch (error) {
        console.error('Error removing address:', error);
    }
}

// Setup form submission
function setupForm() {
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProfile();
    });
}

// Save user profile
async function saveProfile() {
    if (!currentUser) return;
    
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const existingData = userDoc.exists() ? userDoc.data() : {};
        
        const profileData = {
            ...existingData,
            name: document.getElementById('user-name').value,
            phone: document.getElementById('user-phone').value,
            address: document.getElementById('user-address').value,
            updatedAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', currentUser.uid), profileData, { merge: true });
        showMessage('Profile saved successfully!', 'success');
        
        // Return to display mode
        displayProfile(profileData);
        document.getElementById('profile-display').style.display = 'block';
        document.getElementById('profile-form').style.display = 'none';
        document.getElementById('edit-profile-btn').style.display = 'block';
        
        loadSavedAddresses(profileData.addresses || []);
    } catch (error) {
        console.error('Error saving profile:', error);
        showMessage('Error saving profile', 'error');
    }
}

// Show message
function showMessage(message, type) {
    const existing = document.querySelector('.profile-message');
    if (existing) existing.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'profile-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 80px;
        right: -200px;
        padding: 8px 12px;
        z-index: 10000;
        font-weight: 500;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        font-size: 12px;
        border-radius: 4px;
        transition: right 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.right = '20px';
    }, 10);
    
    setTimeout(() => {
        messageDiv.style.right = '-200px';
        setTimeout(() => messageDiv.remove(), 300);
    }, 2000);
}

// Export for use in checkout
export async function getUserProfile() {
    if (!currentUser) return null;
    
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}