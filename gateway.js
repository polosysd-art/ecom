// Gateway Authentication - DO NOT EDIT
import { auth, db } from './frontend/config/firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail,
    fetchSignInMethodsForEmail
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { 
    doc, 
    setDoc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// Admin emails - Add admin emails here
const ADMIN_EMAILS = [
    'admin@cybee.com'
];

let currentUser = null;

// Initialize gateway
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkAuthState();
});

// Setup event listeners
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Toggle forms
    const signupToggle = document.getElementById('signup-toggle');
    if (signupToggle) {
        signupToggle.addEventListener('click', (e) => {
            e.preventDefault();
            showSignupForm();
        });
    }
    
    const loginToggle = document.getElementById('login-toggle');
    if (loginToggle) {
        loginToggle.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }
    
    // Logout (if exists)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Admin link (if exists)
    const adminLink = document.getElementById('admin-link');
    if (adminLink) {
        adminLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'backend/admin/index.html';
        });
    }
}

// Check authentication state
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        updateUI();
    });
}

// Update UI based on auth state
async function updateUI() {
    const guestView = document.getElementById('guest-view');
    const loginSection = document.getElementById('login-section');
    const signupSection = document.getElementById('signup-section');
    const userDashboard = document.getElementById('user-dashboard');
    const adminLink = document.getElementById('admin-link');
    const welcomeMessage = document.getElementById('welcome-message');
    const userStatus = document.getElementById('user-status');
    
    if (currentUser) {
        // Get user data from Firestore
        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            const userData = userDoc.exists() ? userDoc.data() : null;
            const userName = userData?.name || currentUser.email;
            
            // Update welcome messages
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${userName}!`;
            }
            if (userStatus) {
                userStatus.textContent = `Welcome, ${userName}!`;
            }
        } catch (error) {
            console.log('Error fetching user data:', error);
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${currentUser.email}!`;
            }
            if (userStatus) {
                userStatus.textContent = `Welcome, ${currentUser.email}!`;
            }
        }
        
        // User is logged in
        if (guestView) guestView.style.display = 'none';
        if (loginSection) loginSection.style.display = 'none';
        if (signupSection) signupSection.style.display = 'none';
        if (userDashboard) userDashboard.style.display = 'block';
        
        // Check if user is admin
        if (adminLink) {
            if (isAdmin(currentUser.email)) {
                adminLink.style.display = 'block';
            } else {
                adminLink.style.display = 'none';
            }
        }
    } else {
        // User is not logged in
        if (guestView) guestView.style.display = 'block';
        if (loginSection) loginSection.style.display = 'block';
        if (signupSection) signupSection.style.display = 'none';
        if (userDashboard) userDashboard.style.display = 'none';
        if (userStatus) userStatus.textContent = 'Welcome, Guest!';
    }
}

// Check if user is admin
function isAdmin(email) {
    return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'index.html';
    } catch (error) {
        // Stop loading
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
        
        await handleLoginError(error, email);
    }
}

// Handle login errors with specific actions
async function handleLoginError(error, email) {
    switch (error.code) {
        case 'auth/user-not-found':
            showMessage('No account found with this email. Please sign up.', 'error');
            setTimeout(() => {
                showSignupForm();
            }, 2000);
            break;
            
        case 'auth/wrong-password':
            showMessage('Password is wrong.', 'error');
            setTimeout(async () => {
                try {
                    await sendPasswordResetEmail(auth, email);
                    showMessage('Password reset email sent. Check your inbox.', 'success');
                } catch (resetError) {
                    showMessage('Unable to send password reset email.', 'error');
                }
            }, 2000);
            break;
            
        case 'auth/invalid-credential':
            // Use fetchSignInMethodsForEmail to check if user exists
            try {
                const methods = await fetchSignInMethodsForEmail(auth, email);
                if (methods && methods.length > 0) {
                    // User exists - password is wrong
                    showMessage('Password is wrong.', 'error');
                    setTimeout(async () => {
                        try {
                            await sendPasswordResetEmail(auth, email);
                            showMessage('Password reset email sent. Check your inbox.', 'success');
                        } catch (resetError) {
                            showMessage('Unable to send password reset email.', 'error');
                        }
                    }, 2000);
                } else {
                    // User doesn't exist
                    showMessage('No account found with this email. Please sign up.', 'error');
                    setTimeout(() => {
                        showSignupForm();
                    }, 2000);
                }
            } catch (methodsError) {
                // If fetchSignInMethodsForEmail fails, try reset email as fallback
                try {
                    await sendPasswordResetEmail(auth, email);
                    showMessage('Password is wrong.', 'error');
                    setTimeout(() => {
                        showMessage('Password reset email sent. Check your inbox.', 'success');
                    }, 2000);
                } catch (resetError) {
                    if (resetError.code === 'auth/user-not-found') {
                        showMessage('No account found with this email. Please sign up.', 'error');
                        setTimeout(() => {
                            showSignupForm();
                        }, 2000);
                    } else {
                        showMessage('Password is wrong.', 'error');
                    }
                }
            }
            break;
            
        case 'auth/invalid-email':
            showMessage('Invalid email address', 'error');
            break;
            
        case 'auth/too-many-requests':
            showMessage('Too many failed attempts. Try again later.', 'error');
            break;
            
        default:
            showMessage('Login failed: ' + error.message, 'error');
    }
}

// Handle signup
async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const phone = document.getElementById('signup-phone').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
    
    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Wait for auth state to be ready, then store user data
        await new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (authUser) => {
                if (authUser && authUser.uid === user.uid) {
                    unsubscribe();
                    resolve();
                }
            });
        });
        
        // Store user data in Firestore
        try {
            await setDoc(doc(db, 'users', user.uid), {
                name: name,
                phone: phone,
                email: email,
                createdAt: new Date().toISOString()
            });
        } catch (firestoreError) {
            console.log('Firestore write error:', firestoreError);
            // Continue anyway - user account is created
        }
        
        window.location.href = 'index.html';
    } catch (error) {
        // Stop loading
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up';
        
        let errorMessage = 'Signup failed';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Email already in use. Switching to login...';
                setTimeout(() => {
                    showLoginForm();
                }, 2000);
                break;
            case 'auth/weak-password':
                errorMessage = 'Password should be at least 6 characters';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
            default:
                errorMessage = error.message;
        }
        
        showMessage(errorMessage, 'error');
    }
}

// Handle logout
async function handleLogout() {
    try {
        await signOut(auth);
        showMessage('Logged out successfully', 'success');
    } catch (error) {
        showMessage('Error logging out', 'error');
    }
}

// Show signup form
function showSignupForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-section').style.display = 'block';
    document.getElementById('signup-toggle').style.display = 'none';
    document.getElementById('login-toggle').style.display = 'inline';
}

// Show login form
function showLoginForm() {
    document.getElementById('login-form').style.display = '';
    document.getElementById('signup-section').style.display = 'none';
    document.getElementById('signup-toggle').style.display = 'inline';
    document.getElementById('login-toggle').style.display = 'none';
}

// Show loading overlay
function showLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loading-overlay';
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    
    overlay.appendChild(spinner);
    document.body.appendChild(overlay);
}

// Hide loading overlay
function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.getElementById('auth-message');
    messageDiv.innerHTML = message;
    messageDiv.className = `message ${type}`;
    
    // Clear message after 8 seconds for better readability
    setTimeout(() => {
        messageDiv.innerHTML = '';
        messageDiv.className = 'message';
    }, 8000);
}