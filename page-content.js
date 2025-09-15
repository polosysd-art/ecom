// Page Content Loader
import { db } from './firebase-config.js';
import { doc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// Load page content with real-time updates
export function loadPageContent() {
    try {
        onSnapshot(doc(db, 'settings', 'pages'), (settingsDoc) => {
            if (settingsDoc.exists()) {
                const data = settingsDoc.data();
                updatePageContent(data);
            }
        });
        
        // Load hero image separately
        onSnapshot(doc(db, 'settings', 'hero-image'), (heroDoc) => {
            if (heroDoc.exists()) {
                updateHeroImage(heroDoc.data().heroImage);
            }
        });
    } catch (error) {
        console.error('Error loading page content:', error);
    }
}

// Update page content
function updatePageContent(data) {
    // Update hero section
    if (data.heroTitle) {
        const heroTitle = document.getElementById('hero-title');
        if (heroTitle) heroTitle.textContent = data.heroTitle;
    }
    
    if (data.heroSubtitle) {
        const heroSubtitle = document.getElementById('hero-subtitle');
        if (heroSubtitle) heroSubtitle.textContent = data.heroSubtitle;
    }
    
    // Hero image is loaded separately in updateHeroImage function
    

    
    // Update animated title
    if (data.animatedTitle) {
        const animatedTitle = document.getElementById('animated-title');
        if (animatedTitle) {
            animatedTitle.textContent = '';
            animatedTitle.style.display = 'none';
        }
    }
    
    // Update header font
    if (data.headerFont) {
        document.documentElement.style.setProperty('--header-font', data.headerFont);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadPageContent();
});

// Update hero image function
function updateHeroImage(heroImageUrl) {
    const heroBannerImg = document.getElementById('hero-banner-img');
    const heroSection = document.getElementById('hero-section');
    
    if (heroBannerImg && heroImageUrl) {
        heroBannerImg.onload = () => {
            heroBannerImg.style.display = 'block';
            if (heroSection) heroSection.style.background = 'none';
        };
        heroBannerImg.onerror = () => {
            console.error('Failed to load hero image:', heroImageUrl);
            heroBannerImg.style.display = 'none';
            if (heroSection) heroSection.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        };
        heroBannerImg.src = heroImageUrl;
    } else if (heroBannerImg && heroSection) {
        heroBannerImg.style.display = 'none';
        heroSection.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
}

// Update hero image on window resize
window.addEventListener('resize', () => {
    // Reload page content to update hero image for new screen size
    loadPageContent();
});