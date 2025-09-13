// Settings Page Management
import { db, auth } from '../../frontend/config/firebase-config.js';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

let attributes = {
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
    units: []
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAttributes();
});

// Load attributes with real-time updates
function loadAttributes() {
    try {
        onSnapshot(doc(db, 'settings', 'attributes'), (attributesDoc) => {
            if (attributesDoc.exists()) {
                const data = attributesDoc.data();
                attributes = {
                    categories: data.categories || [],
                    brands: data.brands || [],
                    colors: data.colors || [],
                    sizes: data.sizes || [],
                    units: data.units || []
                };
            }
            renderAttributes();
        });
    } catch (error) {
        console.error('Error loading attributes:', error);
    }
}

// Render attributes
function renderAttributes() {
    Object.keys(attributes).forEach(type => {
        const container = document.getElementById(`${type}-list`);
        if (container) {
            container.innerHTML = attributes[type].map((item, index) => `
                <div class="attribute-item">
                    <span>${item}</span>
                    <button class="options-btn" onclick="showOptionsPS('${type}', '${item}', ${index}, event)">⋯</button>
                </div>
            `).join('');
        }
    });
}

// Add attribute
window.addAttribute = async (type) => {
    let inputId;
    if (type === 'categories') {
        inputId = 'new-category';
    } else if (type === 'brands') {
        inputId = 'new-brand';
    } else if (type === 'colors') {
        inputId = 'new-color';
    } else if (type === 'sizes') {
        inputId = 'new-size';
    } else if (type === 'units') {
        inputId = 'new-unit';
    }
    
    const input = document.getElementById(inputId);
    if (!input) {
        console.error('Input not found for type:', type);
        return;
    }
    
    const value = input.value.trim();
    
    if (value) {
        if (attributes[type].includes(value)) {
            alert(`"${value}" already exists in ${type}!`);
            return;
        }
        
        attributes[type].push(value);
        input.value = '';
        await saveAttributes();
        renderAttributes();
    }
};

// Show options popup
window.showOptions = async (type, value, event) => {
    event.stopPropagation();
    
    // Remove existing popup
    const existingPopup = document.querySelector('.options-popup');
    if (existingPopup) existingPopup.remove();
    
    // Check if attribute is used
    const isUsed = await checkAttributeUsage(type, value);
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'options-popup';
    
    let options = `<div class="option" onclick="editAttribute('${type}', '${value}')">Edit</div>`;
    if (!isUsed) {
        options += `<div class="option" onclick="removeAttribute('${type}', '${value}')">Delete</div>`;
    }
    
    popup.innerHTML = options;
    
    // Position popup
    const rect = event.currentTarget.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.top = rect.bottom + 5 + 'px';
    popup.style.left = rect.left + 'px';
    popup.style.zIndex = '1000';
    
    document.body.appendChild(popup);
    
    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', () => popup.remove(), { once: true });
    }, 100);
};

// Edit attribute
window.editAttribute = async (type, oldValue) => {
    const newValue = prompt(`Edit ${type.slice(0, -1)}:`, oldValue);
    if (newValue && newValue.trim() && newValue !== oldValue) {
        const trimmedValue = newValue.trim();
        if (!attributes[type].includes(trimmedValue)) {
            const index = attributes[type].indexOf(oldValue);
            if (index > -1) {
                attributes[type][index] = trimmedValue;
                await saveAttributes();
                await updateProductsAttribute(type, oldValue, trimmedValue);
                // Close all popups after edit
                document.querySelectorAll('.options-popup').forEach(popup => popup.remove());
            }
        } else {
            alert('This value already exists!');
        }
    }
    // Close popups even if cancelled
    document.querySelectorAll('.options-popup').forEach(popup => popup.remove());
};

// Remove attribute
window.removeAttributePS = async (type, index) => {
    const item = attributes[type][index];
    if (confirm(`Delete "${item}"?`)) {
        attributes[type].splice(index, 1);
        await saveAttributes();
        renderAttributes();
    }
    // Close all popups after delete (confirmed or cancelled)
    document.querySelectorAll('.options-popup').forEach(popup => popup.remove());
};

// Show options popup
window.showOptionsPS = (type, value, index, event) => {
    event.stopPropagation();
    
    const parent = event.target.parentElement;
    
    // Close all other popups first
    document.querySelectorAll('.options-popup').forEach(popup => {
        if (!parent.contains(popup)) {
            popup.remove();
        }
    });
    
    // Remove existing popup in this field (toggle)
    const existingPopup = parent.querySelector('.options-popup');
    if (existingPopup) {
        existingPopup.remove();
        return;
    }
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'options-popup';
    popup.innerHTML = `
        <div class="option" onclick="editAttribute('${type}', '${value}')">Edit</div>
        <div class="option" onclick="removeAttributePS('${type}', ${index})">Delete</div>
    `;
    
    // Position popup relative to parent
    popup.style.position = 'absolute';
    popup.style.top = '100%';
    popup.style.right = '0';
    popup.style.zIndex = '1000';
    
    // Make parent relative for positioning
    parent.style.position = 'relative';
    parent.appendChild(popup);
    
    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', (e) => {
            if (!parent.contains(e.target)) {
                popup.remove();
            }
        }, { once: true });
    }, 100);
};

// Alias for compatibility
window.removeAttribute = window.removeAttributePS;

// Check if attribute is used in products
async function checkAttributeUsage(type, value) {
    try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        for (const doc of querySnapshot.docs) {
            const product = doc.data();
            if (type === 'categories' && product.category === value) return true;
            if (type === 'brands' && product.brand === value) return true;
        }
        return false;
    } catch (error) {
        return true;
    }
}

// Update products when attribute is edited
async function updateProductsAttribute(type, oldValue, newValue) {
    try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const { updateDoc, doc: docRef } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        for (const docSnapshot of querySnapshot.docs) {
            const product = docSnapshot.data();
            const updates = {};
            
            if (type === 'categories' && product.category === oldValue) {
                updates.category = newValue;
            }
            if (type === 'brands' && product.brand === oldValue) {
                updates.brand = newValue;
            }
            
            if (Object.keys(updates).length > 0) {
                await updateDoc(docRef(db, 'products', docSnapshot.id), updates);
            }
        }
    } catch (error) {
        console.error('Error updating products:', error);
    }
};

// Save attributes to database
async function saveAttributes() {
    try {
        await setDoc(doc(db, 'settings', 'attributes'), attributes);
    } catch (error) {
        console.error('Error saving attributes:', error);
    }
}