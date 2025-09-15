// Admin Authentication Check - DO NOT EDIT
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// Admin emails - Must match gateway.js
const ADMIN_EMAILS = [
    'admin@cybee.com'
];

// Check admin access
export function checkAdminAccess() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, (user) => {
            if (user && isAdmin(user.email)) {
                resolve(user);
            } else {
                // Redirect to main login page
                window.location.href = './login.html';
                reject('Access denied');
            }
        });
    });
}

// Check if user is admin
function isAdmin(email) {
    return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Auto-check on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess().catch(() => {
        console.log('Redirecting non-admin user');
    });
});