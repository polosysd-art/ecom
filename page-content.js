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
    // Update animated title
    if (data.animatedTitle) {
        const animatedTitle = document.getElementById('animated-title');
        if (animatedTitle) {
            animatedTitle.textContent = data.animatedTitle;
            animatedTitle.style.display = 'block';
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
    const heroSection = document.getElementById('hero-section');
    if (heroSection && heroImageUrl) {
        heroSection.style.backgroundImage = `url(${heroImageUrl})`;
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center';
    }
}

// Update hero image on window resize
window.addEventListener('resize', () => {
    // Reload page content to update hero image for new screen size
    loadPageContent();
});