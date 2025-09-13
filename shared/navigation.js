// Shared Navigation JavaScript - DO NOT EDIT
class Navigation {
    constructor() {
        this.sidebar = null;
        this.overlay = null;
        this.menuToggle = null;
        this.currentUser = null;
        this.adminEmails = ['admin@cybee.com'];
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
        document.addEventListener('DOMContentLoaded', () => {
            this.showPageLoading();
            this.setupElements();
            this.setupEventListeners();
            this.updateCartCount();
            this.setupAuth();
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

        // Admin panel navigation
        const adminNav = document.querySelector('#admin-nav');
        if (adminNav) {
            adminNav.addEventListener('click', (e) => {
                e.preventDefault();
                // Determine correct path to admin dashboard
                const currentPath = window.location.pathname;
                if (currentPath.includes('/frontend/')) {
                    window.location.href = '../backend/admin/dashboard.html';
                } else {
                    window.location.href = 'backend/admin/dashboard.html';
                }
            });
        }

        // Logout navigation
        const logoutNav = document.querySelector('#logout-nav');
        if (logoutNav) {
            logoutNav.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
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
            cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';
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
        // Determine correct path to cart page
        const currentPath = window.location.pathname;
        if (currentPath.includes('/frontend/')) {
            window.location.href = 'shopping-cart.html';
        } else if (currentPath.includes('/backend/')) {
            window.location.href = '../../frontend/shopping-cart.html';
        } else {
            window.location.href = 'frontend/shopping-cart.html';
        }
    }

    // Setup authentication
    async setupAuth() {
        try {
            // Try to import Firebase auth
            let authModule;
            try {
                authModule = await import('../frontend/config/firebase-config.js');
            } catch {
                authModule = await import('./frontend/config/firebase-config.js');
            }
            const { auth } = authModule;
            const { onAuthStateChanged, signOut } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
            
            onAuthStateChanged(auth, (user) => {
                this.currentUser = user;
                this.updateAuthUI();
            });
            
            this.signOut = signOut;
            this.auth = auth;
        } catch (error) {
            console.log('Firebase auth not available, using default UI');
            this.updateAuthUI();
        }
    }

    // Update authentication UI
    updateAuthUI() {
        const loginNav = document.querySelector('#login-nav');
        const profileNav = document.querySelector('#profile-nav');
        const adminNav = document.querySelector('#admin-nav');
        const logoutNav = document.querySelector('#logout-nav');
        const ordersNav = document.querySelector('#orders-nav');
        const userStatus = document.querySelector('#user-status');

        if (this.currentUser) {
            // User is logged in
            if (loginNav) loginNav.style.display = 'none';
            if (profileNav) profileNav.style.display = 'block';
            if (ordersNav) ordersNav.style.display = 'block';
            if (logoutNav) logoutNav.style.display = 'block';
            if (userStatus) userStatus.textContent = `Welcome, ${this.currentUser.email}!`;
            
            // Show admin panel if user is admin
            if (adminNav) {
                if (this.isAdmin(this.currentUser.email)) {
                    adminNav.style.display = 'block';
                } else {
                    adminNav.style.display = 'none';
                }
            }
        } else {
            // User is not logged in
            if (loginNav) loginNav.style.display = 'block';
            if (profileNav) profileNav.style.display = 'none';
            if (ordersNav) ordersNav.style.display = 'none';
            if (adminNav) adminNav.style.display = 'none';
            if (logoutNav) logoutNav.style.display = 'none';
            if (userStatus) userStatus.textContent = 'Welcome, Guest!';
        }
    }

    // Check if user is admin
    isAdmin(email) {
        return this.adminEmails.includes(email.toLowerCase());
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
                
                // Always redirect to home page
                const currentPath = window.location.pathname;
                if (currentPath.includes('/frontend/')) {
                    window.location.href = '../index.html';
                } else if (currentPath.includes('/backend/')) {
                    window.location.href = '../../index.html';
                } else {
                    window.location.href = 'index.html';
                }
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
            let configModule;
            try {
                configModule = await import('../frontend/config/firebase-config.js');
            } catch {
                configModule = await import('./frontend/config/firebase-config.js');
            }
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
            // Hide loading after initial load
            setTimeout(() => {
                this.hidePageLoading();
            }, 500);
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
                const currentPath = window.location.pathname;
                if (currentPath.includes('/frontend/')) {
                    window.location.href = '../index.html';
                } else if (currentPath.includes('/backend/')) {
                    window.location.href = '../../index.html';
                } else {
                    window.location.href = 'index.html';
                }
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