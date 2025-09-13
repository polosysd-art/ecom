// Sidebar Gallery Component
import { db } from '../frontend/config/firebase-config.js';
import { collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

let sidebarGallery = null;
let galleryToggle = null;
let galleryOverlay = null;

// Initialize sidebar gallery
export function initSidebarGallery() {
    createGalleryElements();
    loadGalleryImages();
    setupEventListeners();
}

// Create gallery elements
function createGalleryElements() {
    // Toggle button
    galleryToggle = document.createElement('button');
    galleryToggle.className = 'gallery-toggle';
    galleryToggle.innerHTML = '<i class="fas fa-images"></i>';
    document.body.appendChild(galleryToggle);
    
    // Sidebar gallery
    sidebarGallery = document.createElement('div');
    sidebarGallery.className = 'sidebar-gallery';
    sidebarGallery.innerHTML = `
        <div class="sidebar-gallery-header">
            <h3>Image Gallery</h3>
            <p>Click to copy URL</p>
        </div>
        <div class="sidebar-gallery-content">
            <div class="gallery-mini-grid" id="gallery-mini-grid">
                <!-- Images loaded here -->
            </div>
        </div>
    `;
    document.body.appendChild(sidebarGallery);
    
    // Overlay
    galleryOverlay = document.createElement('div');
    galleryOverlay.className = 'sidebar-gallery-overlay';
    document.body.appendChild(galleryOverlay);
}

// Load gallery images
function loadGalleryImages() {
    onSnapshot(collection(db, 'gallery'), (snapshot) => {
        const grid = document.getElementById('gallery-mini-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const item = document.createElement('div');
            item.className = 'gallery-mini-item';
            item.innerHTML = `<img src="${data.url}" alt="${data.name}">`;
            item.onclick = () => copyImageUrl(data.url);
            grid.appendChild(item);
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    galleryToggle.onclick = toggleGallery;
    galleryOverlay.onclick = closeGallery;
}

// Toggle gallery
function toggleGallery() {
    sidebarGallery.classList.toggle('open');
    galleryOverlay.classList.toggle('show');
}

// Close gallery
function closeGallery() {
    sidebarGallery.classList.remove('open');
    galleryOverlay.classList.remove('show');
}

// Copy image URL
function copyImageUrl(url) {
    navigator.clipboard.writeText(url);
    showMessage('Image URL copied!');
    closeGallery();
}

// Show message
function showMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 10px 15px;
        border-radius: 4px;
        z-index: 1001;
    `;
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 2000);
}