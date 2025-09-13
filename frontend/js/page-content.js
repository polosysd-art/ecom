// Page Content Loader
import { db } from '../config/firebase-config.js';
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
    
    // Update hero banner with responsive images
    const heroBanner = document.getElementById('hero-banner');
    const heroBannerImg = document.getElementById('hero-banner-img');
    const heroSection = document.getElementById('hero-section');
    const heroContent = document.querySelector('.hero-content');
    
    // Determine which hero image to use based on screen size
    let heroImageUrl;
    if (window.innerWidth <= 768) {
        heroImageUrl = data.heroBannerMobile || data.heroBanner;
    } else if (window.innerWidth <= 899) {
        heroImageUrl = data.heroBannerTablet || data.heroBanner;
    } else {
        heroImageUrl = data.heroBanner;
    }
    
    if (heroBanner && heroBannerImg && heroImageUrl) {
        heroBannerImg.src = heroImageUrl;
        heroBanner.style.display = 'block';
        if (heroSection) heroSection.classList.add('has-banner');
    } else {
        heroBanner.style.display = 'none';
        if (heroSection) {
            heroSection.classList.remove('has-banner');
        }
    }
    
    // Update hero text visibility and positioning
    if (heroContent && heroSection) {
        if (data.heroTextVisible !== false) {
            heroContent.style.display = 'inline-block';
            heroSection.classList.remove('text-hidden');
        } else {
            heroContent.style.display = 'none';
            heroSection.classList.add('text-hidden');
        }
        
        if (data.heroTextPadding) {
            heroContent.style.padding = data.heroTextPadding;
        }
        
        if (data.heroTextMargin) {
            heroContent.style.margin = data.heroTextMargin;
        }
    }
    
    // Update animated title
    if (data.animatedTitle) {
        const animatedTitle = document.getElementById('animated-title');
        if (animatedTitle) animatedTitle.textContent = data.animatedTitle;
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

// Update hero image on window resize
window.addEventListener('resize', () => {
    // Reload page content to update hero image for new screen size
    loadPageContent();
});