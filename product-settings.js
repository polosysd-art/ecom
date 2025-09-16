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
    
    container.innerHTML = '';
    
    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'attribute-item';
        itemDiv.style.cursor = 'pointer';
        itemDiv.addEventListener('click', () => showAttributeOptions(attributeType, item));
        
        const span = document.createElement('span');
        span.textContent = attributeType === 'vatRates' ? `${item}%` : item;
        itemDiv.appendChild(span);
        
        if (attributeType === 'vatRates' && attributes.defaultVat == item) {
            const badge = document.createElement('span');
            badge.className = 'badge bg-success ms-2';
            badge.textContent = 'Default';
            itemDiv.appendChild(badge);
        }
        
        container.appendChild(itemDiv);
    });
}

// Add new attribute
window.addAttribute = async function(attributeType) {
    const value = window.prompt(`Enter new ${attributeType.slice(0, -1)}:`);
    if (value && value.trim()) {
        const trimmedValue = value.trim();
        
        // Validate input length and content
        if (trimmedValue.length > 50) {
            showToast('Value too long (max 50 characters)', 'error');
            return;
        }
        
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
    
    const title = document.createElement('h6');
    title.className = 'mb-3';
    title.textContent = value;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'd-flex gap-2 justify-content-center';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-primary btn-sm';
    editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
    editBtn.addEventListener('click', () => {
        editAttribute(attributeType, value);
        closePopup();
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-sm';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
    deleteBtn.addEventListener('click', () => deleteAttribute(attributeType, value));
    
    buttonContainer.appendChild(editBtn);
    buttonContainer.appendChild(deleteBtn);
    
    popup.appendChild(title);
    popup.appendChild(buttonContainer);
    
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
    backdrop.addEventListener('click', closePopup);
    
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
    const newValue = window.prompt(`Edit ${attributeType.slice(0, -1)}:`, oldValue);
    if (newValue && newValue.trim() && newValue.trim() !== oldValue) {
        const trimmedValue = newValue.trim();
        
        if (trimmedValue.length > 50) {
            showToast('Value too long (max 50 characters)', 'error');
            return;
        }
        
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
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'd-flex align-items-center';
    
    const icon = document.createElement('i');
    icon.className = `fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`;
    
    const span = document.createElement('span');
    span.textContent = message;
    
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close ms-auto';
    closeBtn.addEventListener('click', () => toast.remove());
    
    alertDiv.appendChild(icon);
    alertDiv.appendChild(span);
    alertDiv.appendChild(closeBtn);
    toast.appendChild(alertDiv);
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}