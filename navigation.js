// Shared Navigation JavaScript - DO NOT EDIT
class Navigation {
    constructor() {
        this.sidebar = null;
        this.overlay = null;
        this.menuToggle = null;
        this.currentUser = null;

        this.pageCache = {
            store: null,
            pages: null,
            lastUpdated: {
                store: 0,
                pages: 0
            }
        };
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', async () => {
            // Skip loading for login page
            if (!window.location.pathname.includes('login.html')) {
                this.showPageLoading();
            }
            this.setupElements();
            this.setupEventListeners();
            this.updateCartCount();
            await this.setupAuth();
            this.loadStoreName();
        });
    }

    setupElements() {
        this.sidebar = document.querySelector('.sidebar');
        this.overlay = document.querySelector('.sidebar-overlay');
        this.menuToggle = document.querySelector('.menu-toggle');
    }

    setupEventListeners() {
        // Menu toggle
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Overlay click
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeSidebar());
        }

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSidebar();
            }
        });

        // Close sidebar on navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.closeSidebar();
                }
            });
        });

        // Search functionality
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleSearch());
        }

        // Cart functionality
        const cartBtn = document.querySelector('.cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => this.handleCart());
        }

        // Logout navigation - handle both old and new sidebar structures
        document.addEventListener('click', (e) => {
            if ((e.target.closest('.auth-only') || e.target.closest('.nav-link.auth-only')) && 
                e.target.closest('a[href="#"]') && 
                e.target.textContent.includes('Logout')) {
                e.preventDefault();
                this.handleLogout();
            }
        });
    }

    toggleSidebar() {
        if (this.sidebar && this.overlay) {
            this.sidebar.classList.toggle('open');
            this.overlay.classList.toggle('show');
        }
    }

    closeSidebar() {
        if (this.sidebar && this.overlay) {
            this.sidebar.classList.remove('open');
            this.overlay.classList.remove('show');
        }
    }

    updateCartCount() {
        const cartCountEl = document.querySelector('.cart-count');
        if (cartCountEl) {
            // Get cart from localStorage or use 0
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            cartCountEl.textContent = totalItems;
            cartCountEl.style.display = totalItems > 0 ? 'inline' : 'none';
        }
    }

    handleSearch() {
        // Simple search implementation
        const query = prompt('Search products:');
        if (query) {
            window.location.href = `products.html?search=${encodeURIComponent(query)}`;
        }
    }

    handleCart() {
        window.location.href = 'shopping-cart.html';
    }

    // Setup authentication
    async setupAuth() {
        try {
            // Try to import Firebase auth
            const authModule = await import('./firebase-config.js');
            const { auth, db } = authModule;
            const { onAuthStateChanged, signOut } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
            
            // Set current user immediately if already logged in
            this.currentUser = auth.currentUser;
            this.updateAuthUI();
            
            // Listen for auth state changes
            onAuthStateChanged(auth, (user) => {
                this.currentUser = user;
                this.updateAuthUI();
            });
            
            this.signOut = signOut;
            this.auth = auth;
        } catch (error) {
            console.error('DEBUG: Firebase setup failed:', error);
            this.currentUser = null;
            this.updateAuthUI();
        }
    }

    // Update authentication UI
    updateAuthUI() {
        // Get all elements with role classes (avoid duplicates)
        const guestElements = document.querySelectorAll('.guest-only, .nav-link.guest-only');
        const authElements = document.querySelectorAll('.auth-only, .nav-link.auth-only');
        const adminElements = document.querySelectorAll('.admin-only, .nav-link.admin-only');
        const userStatus = document.querySelector('#user-status');

        if (this.currentUser) {
            // User is logged in - hide guest, show auth
            guestElements.forEach(el => el.style.setProperty('display', 'none', 'important'));
            authElements.forEach(el => el.style.setProperty('display', 'block', 'important'));
            if (userStatus) userStatus.textContent = `Welcome, ${this.currentUser.email}!`;
            
            // Show admin panel only for admin@cybee.com
            if (this.currentUser.email === 'admin@cybee.com') {
                adminElements.forEach(el => el.style.setProperty('display', 'block', 'important'));
            } else {
                adminElements.forEach(el => el.style.setProperty('display', 'none', 'important'));
            }
        } else {
            // User is not logged in - show guest, hide auth/admin
            guestElements.forEach(el => el.style.setProperty('display', 'block', 'important'));
            authElements.forEach(el => el.style.setProperty('display', 'none', 'important'));
            adminElements.forEach(el => el.style.setProperty('display', 'none', 'important'));
            if (userStatus) userStatus.textContent = 'Welcome, Guest!';
        }
    }



    // Handle logout
    async handleLogout() {
        const logoutBtn = document.querySelector('#logout-nav');
        const adminLogoutBtn = document.querySelector('#admin-logout');
        
        try {
            // Show processing state
            if (logoutBtn) {
                logoutBtn.classList.add('processing');
                logoutBtn.textContent = '🚪 Logging out...';
            }
            if (adminLogoutBtn) {
                adminLogoutBtn.classList.add('processing');
            }
            
            if (this.signOut && this.auth) {
                await this.signOut(this.auth);
                
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Reset button state on error
            if (logoutBtn) {
                logoutBtn.classList.remove('processing');
                logoutBtn.textContent = '🚪 Logout';
            }
            if (adminLogoutBtn) {
                adminLogoutBtn.classList.remove('processing');
            }
        }
    }

    // Show page loading overlay
    showPageLoading() {
        const overlay = document.createElement('div');
        overlay.className = 'page-loading';
        overlay.id = 'page-loading';
        
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'loading-dots';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dotsContainer.appendChild(dot);
        }
        
        overlay.appendChild(dotsContainer);
        document.body.appendChild(overlay);
    }

    // Hide page loading overlay
    hidePageLoading() {
        const overlay = document.getElementById('page-loading');
        if (overlay) {
            overlay.remove();
        }
    }

    // Load store name from database with real-time updates
    async loadStoreName() {
        try {
            const configModule = await import('./firebase-config.js');
            const { db } = configModule;
            const { doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            
            // Real-time listener for store settings with caching
            onSnapshot(doc(db, 'settings', 'store'), (settingsDoc) => {
                if (settingsDoc.exists()) {
                    const data = settingsDoc.data();
                    const currentTime = Date.now();
                    
                    // Only update if data changed or first load
                    if (!this.pageCache.store || JSON.stringify(this.pageCache.store) !== JSON.stringify(data)) {
                        this.pageCache.store = data;
                        this.pageCache.lastUpdated.store = currentTime;
                        
                        const storeName = data.storeName || 'Store';
                        this.updateStoreName(storeName);
                        this.updateStoreLogo(data.storeLogo);
                    }
                } else {
                    this.updateStoreName('Store');
                    this.updateStoreLogo('');
                }
            });
            
            // Real-time listener for page settings with caching
            onSnapshot(doc(db, 'settings', 'pages'), (pagesDoc) => {
                if (pagesDoc.exists()) {
                    const data = pagesDoc.data();
                    const currentTime = Date.now();
                    
                    // Only update if data changed or first load
                    if (!this.pageCache.pages || JSON.stringify(this.pageCache.pages) !== JSON.stringify(data)) {
                        this.pageCache.pages = data;
                        this.pageCache.lastUpdated.pages = currentTime;
                        this.updatePageTexts(data);
                    }
                } else {
                    this.updatePageTexts({});
                }
            });
            
        } catch (error) {
            console.log('Using default store name');
            this.updateStoreName('Store');
        } finally {
            // Hide loading after initial load (skip for login page)
            if (!window.location.pathname.includes('login.html')) {
                setTimeout(() => {
                    this.hidePageLoading();
                }, 500);
            }
        }
    }

    // Update store name and logo in UI
    updateStoreName(name) {
        // Skip updating store name in admin pages
        if (document.body.classList.contains('admin-page')) {
            return;
        }
        
        const titleElements = document.querySelectorAll('.top-bar-title');
        titleElements.forEach(el => {
            el.textContent = name;
            el.style.cursor = 'pointer';
            el.onclick = () => {
                window.location.href = 'index.html';
            };
        });
        
        const sidebarHeaders = document.querySelectorAll('.sidebar-header h2');
        sidebarHeaders.forEach(el => {
            el.textContent = name;
        });
    }

    // Update store logo
    updateStoreLogo(logoUrl) {
        const logoElements = document.querySelectorAll('.store-logo');
        logoElements.forEach(el => {
            if (logoUrl && logoUrl.trim()) {
                el.src = logoUrl;
                el.classList.add('visible');
            } else {
                el.classList.remove('visible');
            }
        });
    }

    // Update page texts
    updatePageTexts(data) {
        // Update hero section
        const heroTitle = document.getElementById('hero-title');
        const heroSubtitle = document.getElementById('hero-subtitle');
        
        if (heroTitle) {
            heroTitle.textContent = data.heroTitle || 'Welcome to Our Store';
        }
        if (heroSubtitle) {
            heroSubtitle.textContent = data.heroSubtitle || 'Find amazing products at great prices';
        }
    }

    // Set active navigation item
    setActiveNav(page) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === page || item.getAttribute('data-page') === page) {
                item.classList.add('active');
            }
        });
    }

    // Get cached page data
    getCachedPageData(type) {
        return this.pageCache[type];
    }

    // Check if cache is fresh (less than 5 minutes old)
    isCacheFresh(type) {
        const cacheAge = Date.now() - this.pageCache.lastUpdated[type];
        return cacheAge < 300000; // 5 minutes
    }

    // Clear cache
    clearCache(type = null) {
        if (type) {
            this.pageCache[type] = null;
            this.pageCache.lastUpdated[type] = 0;
        } else {
            this.pageCache = {
                store: null,
                pages: null,
                lastUpdated: { store: 0, pages: 0 }
            };
        }
    }

    // Show notification
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }


}

// Initialize navigation
const navigation = new Navigation();

// Export for use in other files
window.Navigation = Navigation;
window.navigation = navigation;

// Global notification function
window.showNotification = function(message, type = 'success') {
    navigation.showNotification(message, type);
};

// Global logout function
window.handleLogout = async function() {
    if (window.navigation) {
        await window.navigation.handleLogout();
    }
};