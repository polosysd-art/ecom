// Clear existing hero banner images from Firebase
import { db } from './frontend/config/firebase-config.js';
import { doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

async function clearImages() {
    try {
        await updateDoc(doc(db, 'settings', 'pages'), {
            heroBannerDesktop: '',
            heroBannerTablet: '',
            heroBannerMobile: '',
            heroBanner: ''
        });
        console.log('Images cleared successfully');
    } catch (error) {
        console.error('Error clearing images:', error);
    }
}

// Run when page loads
document.addEventListener('DOMContentLoaded', clearImages);