// Gallery Management
import { db, storage } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';

document.addEventListener('DOMContentLoaded', () => {
    loadGallery();
    setupUpload();
    setupUploadButton();
});

// Load gallery images
function loadGallery() {
    console.log('Loading gallery images...');
    onSnapshot(collection(db, 'gallery'), (snapshot) => {
        console.log('Gallery snapshot received, size:', snapshot.size);
        const grid = document.getElementById('gallery-grid');
        grid.innerHTML = '';
        
        if (snapshot.empty) {
            console.log('No images found in gallery');
            grid.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No images found. Upload some images to get started.</p>';
            return;
        }
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            console.log('Loading image:', doc.id, data);
            const imageCard = createImageCard(doc.id, data);
            grid.appendChild(imageCard);
        });
    }, (error) => {
        console.error('Gallery loading error:', error);
        const grid = document.getElementById('gallery-grid');
        grid.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 40px;">Error loading gallery. Check console for details.</p>';
    });
}

// Create image card
function createImageCard(id, data) {
    const card = document.createElement('div');
    card.className = 'gallery-item';
    
    const img = document.createElement('img');
    img.src = data.url || '';
    img.alt = data.name || '';
    img.loading = 'eager';
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => previewImage(data.url, data.name, id, data.path));
    
    const info = document.createElement('div');
    info.className = 'gallery-item-info';
    
    const nameP = document.createElement('p');
    nameP.textContent = data.name || '';
    
    const sizeSmall = document.createElement('small');
    sizeSmall.textContent = formatFileSize(data.size || 0);
    
    info.appendChild(nameP);
    info.appendChild(sizeSmall);
    
    card.appendChild(img);
    card.appendChild(info);
    
    return card;
}

// Setup upload functionality
function setupUpload() {
    const fileInput = document.getElementById('image-upload');
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
}

// Setup upload button
function setupUploadButton() {
    document.getElementById('upload-btn').addEventListener('click', showUploadModal);
}

// Show upload modal
function showUploadModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background: white; padding: 30px; border-radius: 8px; text-align: center; min-width: 300px;';
    
    const title = document.createElement('h3');
    title.textContent = 'Upload Image';
    modalContent.appendChild(title);
    
    modalContent.appendChild(document.createElement('br'));
    
    const chooseBtn = document.createElement('button');
    chooseBtn.className = 'btn';
    chooseBtn.textContent = 'Choose File';
    chooseBtn.style.cssText = 'background: white; color: #333; border: 1px solid #ddd;';
    chooseBtn.addEventListener('click', () => document.getElementById('image-upload').click());
    modalContent.appendChild(chooseBtn);
    
    modalContent.appendChild(document.createElement('br'));
    modalContent.appendChild(document.createElement('br'));
    
    const urlInput = document.createElement('input');
    urlInput.type = 'url';
    urlInput.id = 'url-input';
    urlInput.placeholder = 'Or paste image URL';
    urlInput.style.cssText = 'width: 100%; padding: 10px; margin-bottom: 15px;';
    modalContent.appendChild(urlInput);
    
    modalContent.appendChild(document.createElement('br'));
    
    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'btn';
    uploadBtn.textContent = 'Upload from URL';
    uploadBtn.style.cssText = 'background: white; color: #333; border: 1px solid #ddd;';
    uploadBtn.addEventListener('click', uploadFromUrl);
    modalContent.appendChild(uploadBtn);
    
    modalContent.appendChild(document.createElement('br'));
    modalContent.appendChild(document.createElement('br'));
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => modal.remove());
    modalContent.appendChild(cancelBtn);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

// Handle file uploads
async function handleFiles(files) {
    for (const file of files) {
        if (file.type.startsWith('image/')) {
            await uploadImage(file);
        }
    }
}

// Upload single image
async function uploadImage(file) {
    showProcessing(true);
    
    try {
        const base64Url = await convertToBase64(file);
        
        await addDoc(collection(db, 'gallery'), {
            name: file.name,
            url: base64Url,
            path: '',
            size: file.size,
            uploadedAt: new Date().toISOString()
        });
        
        showProcessing(false);
        showPreview(file.name, base64Url);
        showMessage('✓ Uploaded!', 'success');
        
    } catch (error) {
        showProcessing(false);
        showMessage('✗ Upload failed', 'error');
    }
}

// Convert to base64 with high quality
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Copy URL to clipboard
window.copyUrl = function(url) {
    navigator.clipboard.writeText(url);
    // Close modal
    const modal = document.querySelector('div[style*="rgba(0,0,0,0.9)"]');
    if (modal) modal.remove();
    showMessage('URL copied to clipboard', 'success');
};

// Delete image
window.deleteImage = async function(id, path) {
    if (confirm('Delete this image?')) {
        try {
            await deleteDoc(doc(db, 'gallery', id));
            showMessage('✓ Deleted', 'success');
        } catch (error) {
            console.error('Delete error:', error);
            showMessage('✗ Delete failed', 'error');
        }
    }
};

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show processing overlay
function showProcessing(show) {
    let overlay = document.getElementById('processing-overlay');
    
    if (show) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'processing-overlay';
            overlay.innerHTML = `
                <div class="processing-content">
                    <div class="spinner"></div>
                    <p>Uploading...</p>
                </div>
            `;
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            `;
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    } else {
        if (overlay) overlay.style.display = 'none';
    }
}


// Show preview after upload
function showPreview(name, url) {
    const preview = document.createElement('div');
    preview.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        text-align: center;
    `;
    preview.innerHTML = `
        <h3>${name}</h3>
        <img src="${url}" style="max-width: 300px; max-height: 300px; border-radius: 4px;" loading="eager">
        <br><br>
        <button onclick="this.parentElement.remove()" class="btn" style="background: white; color: #333; border: 1px solid #ddd;">Close</button>
    `;
    document.body.appendChild(preview);
}

// Set hero image with view type selection
window.setHeroImage = function(url) {
    const modal = document.createElement('div');
    modal.id = 'hero-image-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 8px; min-width: 300px;">
            <h3>Set Hero Image</h3>
            <p>Select view types to apply this image:</p>
            <br>
            <label style="display: block; margin: 10px 0;">
                <input type="checkbox" id="desktop-view" checked> Desktop View
            </label>
            <label style="display: block; margin: 10px 0;">
                <input type="checkbox" id="tablet-view" checked> Tablet View
            </label>
            <label style="display: block; margin: 10px 0;">
                <input type="checkbox" id="mobile-view" checked> Mobile View
            </label>
            <br>
            <button class="btn" onclick="applyHeroImage('${url}')" style="background: white; color: #333; border: 1px solid #ddd;">Apply</button>
            <button class="btn" onclick="document.getElementById('hero-image-modal').remove()" style="margin-left: 10px; background: white; color: #333; border: 1px solid #ddd;">Cancel</button>
        </div>
    `;
    document.body.appendChild(modal);
};

// Apply hero image to selected view types
window.applyHeroImage = async function(url) {
    const desktop = document.getElementById('desktop-view').checked;
    const tablet = document.getElementById('tablet-view').checked;
    const mobile = document.getElementById('mobile-view').checked;
    
    console.log('Selected views:', { desktop, tablet, mobile });
    
    if (!desktop && !tablet && !mobile) {
        showMessage('✗ Select at least one view type', 'error');
        return;
    }
    
    try {
        const updateData = {};
        
        if (desktop) {
            updateData.heroBanner = url;
            console.log('Setting desktop heroBanner to:', url);
        }
        if (tablet) {
            updateData.heroBannerTablet = url;
            console.log('Setting tablet heroBannerTablet to:', url);
        }
        if (mobile) {
            updateData.heroBannerMobile = url;
            console.log('Setting mobile heroBannerMobile to:', url);
        }
        
        console.log('Final update data:', updateData);
        console.log('Desktop checked:', desktop, 'Tablet checked:', tablet, 'Mobile checked:', mobile);
        
        const docRef = doc(db, 'settings', 'pages');
        await setDoc(docRef, updateData, { merge: true });
        
        console.log('Successfully updated');
        showMessage('✓ Hero image updated!', 'success');
    } catch (error) {
        console.error('Detailed error:', error.message, error.code, error);
        showMessage('✗ Failed: ' + error.message, 'error');
    } finally {
        // Always close modal regardless of success or failure
        const modal = document.getElementById('hero-image-modal');
        if (modal) modal.remove();
    }
};

// Upload from URL
window.uploadFromUrl = async function() {
    const url = document.getElementById('url-input').value;
    if (!url) return;
    
    try {
        await addDoc(collection(db, 'gallery'), {
            name: 'Image from URL',
            url: url,
            path: '',
            size: 0,
            uploadedAt: new Date().toISOString()
        });
        
        document.querySelector('div[style*="rgba(0,0,0,0.7)"]').remove();
        showMessage('✓ URL uploaded!', 'success');
    } catch (error) {
        showMessage('✗ URL upload failed', 'error');
    }
};

// Preview image in modal
window.previewImage = function(url, name, id, path) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    modal.innerHTML = `
        <div style="text-align: center; max-width: 90%; max-height: 90%; position: relative;">
            <button onclick="event.stopPropagation(); this.closest('div').parentElement.remove()" style="position: absolute; top: -10px; right: -10px; background: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px;">&times;</button>
            <img src="${url}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" loading="eager">
            <h3 style="color: white; margin: 20px 0 10px 0;">${name}</h3>
            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px; flex-wrap: wrap;">
                <button onclick="event.stopPropagation(); setHeroImage('${url}')" style="background: white; color: #333; border: 1px solid #ddd; padding: 10px 15px; border-radius: 5px; cursor: pointer;"><i class="fas fa-image"></i> Set Hero</button>
                <button onclick="event.stopPropagation(); copyUrl('${url}')" style="background: white; color: #333; border: 1px solid #ddd; padding: 10px 15px; border-radius: 5px; cursor: pointer;"><i class="fas fa-copy"></i> Copy URL</button>
                <a href="${url}" download="${name}" onclick="event.stopPropagation(); setTimeout(() => { const modal = document.querySelector('div[style*=\"rgba(0,0,0,0.9)\"]'); if (modal) modal.remove(); showMessage('Download started', 'success'); }, 100);" style="background: white; color: #333; border: 1px solid #ddd; padding: 10px 15px; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block;"><i class="fas fa-download"></i> Download</a>
                <button onclick="event.stopPropagation(); deleteImageFromModal('${id}', '${path}', this)" style="background: white; color: #333; border: 1px solid #ddd; padding: 10px 15px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash"></i> Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

// Delete image from modal
window.deleteImageFromModal = async function(id, path, button) {
    if (confirm('Delete this image?')) {
        // Close modal first
        const modal = document.querySelector('div[style*="rgba(0,0,0,0.9)"]');
        if (modal) modal.remove();
        
        try {
            await deleteDoc(doc(db, 'gallery', id));
            showMessage('✓ Deleted', 'success');
        } catch (error) {
            console.error('Delete error:', error);
            showMessage('✗ Delete failed', 'error');
        }
    }
};

function showMessage(message, type) {
    const existing = document.querySelector('.gallery-message');
    if (existing) existing.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 10px 15px;
        border-radius: 4px;
        z-index: 1000;
        font-weight: bold;
        ${type === 'success' ? 
            'background: #2ecc71; color: white;' : 
            'background: #e74c3c; color: white;'
        }
    `;
    
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 2000);
}