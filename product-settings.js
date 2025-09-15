// Product Settings Management
import { db } from './firebase-config.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

let attributes = { categories: [], brands: [], colors: [], sizes: [], units: [], vatRates: [], defaultVat: 0 };

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAttributes();
});

// Load attributes from Firebase
async function loadAttributes() {
    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'attributes'));
        if (settingsDoc.exists()) {
            attributes = { ...attributes, ...settingsDoc.data() };
        }
        renderAllAttributes();
    } catch (error) {
        console.error('Error loading attributes:', error);
    }
}

// Render all attribute lists
function renderAllAttributes() {
    Object.keys(attributes).forEach(key => {
        if (key !== 'defaultVat') {
            renderAttributeList(key);
        }
    });
    loadDefaultVatDropdown();
}

// Load default VAT dropdown
function loadDefaultVatDropdown() {
    const defaultVatSelect = document.getElementById('default-vat');
    if (!defaultVatSelect) return;
    
    const vatRates = attributes.vatRates || [];
    defaultVatSelect.innerHTML = '<option value="0">No Default</option>' + 
        vatRates.map(rate => `<option value="${rate}" ${attributes.defaultVat == rate ? 'selected' : ''}>${rate}%</option>`).join('');
}

// Render specific attribute list
function renderAttributeList(attributeType) {
    const container = document.getElementById(`${attributeType}-list`);
    if (!container) return;
    
    const items = attributes[attributeType] || [];
    
    if (items.length === 0) {
        container.innerHTML = '<p class="text-muted small">No items added yet</p>';
        return;
    }
    
    if (attributeType === 'vatRates') {
        container.innerHTML = items.map(item => {
            const isDefault = attributes.defaultVat == item;
            return `
                <div class="attribute-item" onclick="showAttributeOptions('${attributeType}', '${item}')" style="cursor: pointer;">
                    <span>${item}%</span>
                    ${isDefault ? '<span class="badge bg-success ms-2">Default</span>' : ''}
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML = items.map(item => `
            <div class="attribute-item" onclick="showAttributeOptions('${attributeType}', '${item}')" style="cursor: pointer;">
                <span>${item}</span>
            </div>
        `).join('');
    }
}

// Add new attribute
window.addAttribute = async function(attributeType) {
    const value = prompt(`Enter new ${attributeType.slice(0, -1)}:`);
    if (value && value.trim()) {
        const trimmedValue = value.trim();
        
        if (!attributes[attributeType].includes(trimmedValue)) {
            attributes[attributeType].push(trimmedValue);
            await saveAttributes();
            renderAttributeList(attributeType);
            if (attributeType === 'vatRates') loadDefaultVatDropdown();
            showToast(`${trimmedValue} added successfully!`, 'success');
        } else {
            showToast('Item already exists!', 'error');
        }
    }
};

// Show attribute options window
window.showAttributeOptions = function(attributeType, value) {
    // Remove existing popup
    const existing = document.getElementById('attribute-popup');
    if (existing) existing.remove();
    
    const popup = document.createElement('div');
    popup.id = 'attribute-popup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        padding: 20px;
        min-width: 200px;
        text-align: center;
    `;
    
    popup.innerHTML = `
        <h6 class="mb-3">${value}</h6>
        <div class="d-flex gap-2 justify-content-center">
            <button class="btn btn-primary btn-sm" onclick="editAttribute('${attributeType}', '${value}'); closePopup()">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteAttribute('${attributeType}', '${value}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'popup-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.3);
        z-index: 9999;
    `;
    backdrop.onclick = closePopup;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(popup);
};

// Close popup
window.closePopup = function() {
    const popup = document.getElementById('attribute-popup');
    const backdrop = document.getElementById('popup-backdrop');
    if (popup) popup.remove();
    if (backdrop) backdrop.remove();
};

// Edit attribute
window.editAttribute = async function(attributeType, oldValue) {
    const newValue = prompt(`Edit ${attributeType.slice(0, -1)}:`, oldValue);
    if (newValue && newValue.trim() && newValue.trim() !== oldValue) {
        const trimmedValue = newValue.trim();
        
        if (!attributes[attributeType].includes(trimmedValue)) {
            const index = attributes[attributeType].indexOf(oldValue);
            attributes[attributeType][index] = trimmedValue;
            await saveAttributes();
            renderAttributeList(attributeType);
            if (attributeType === 'vatRates') loadDefaultVatDropdown();
            showToast(`Updated to "${trimmedValue}"!`, 'success');
        } else {
            showToast('Item already exists!', 'error');
        }
    }
};

// Delete attribute
window.deleteAttribute = async function(attributeType, value) {
    closePopup();
    if (confirm(`Remove "${value}"?`)) {
        attributes[attributeType] = attributes[attributeType].filter(item => item !== value);
        await saveAttributes();
        if (attributeType === 'vatRates' && attributes.defaultVat == value) {
            attributes.defaultVat = 0;
        }
        renderAttributeList(attributeType);
        if (attributeType === 'vatRates') loadDefaultVatDropdown();
        showToast(`${value} removed successfully!`, 'success');
    }
};

// Save attributes to Firebase
async function saveAttributes() {
    try {
        await setDoc(doc(db, 'settings', 'attributes'), attributes);
    } catch (error) {
        console.error('Error saving attributes:', error);
        showToast('Error saving changes', 'error');
    }
}

// Set default VAT
window.setDefaultVat = async function() {
    const defaultVatSelect = document.getElementById('default-vat');
    attributes.defaultVat = parseFloat(defaultVatSelect.value) || 0;
    await saveAttributes();
    showToast('Default VAT saved!', 'success');
};

// Toast notification
function showToast(message, type = 'info') {
    const existingToast = document.getElementById('custom-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.id = 'custom-toast';
    toast.className = `alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed`;
    toast.style.cssText = `top: 80px; right: 20px; z-index: 10000; min-width: 300px;`;
    toast.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
            <span>${message}</span>
            <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}