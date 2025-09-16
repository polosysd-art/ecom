import { auth, db } from './firebase-config.js';
import { onSnapshot, collection, query, orderBy, limit, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class NotificationManager {
    constructor() {
        this.lastOrderTime = null;
        this.lastOrderStatusChange = new Map();
        this.isAdmin = false;
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }

        // Listen for auth changes
        auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            if (user) {
                this.checkUserRole();
                this.startListening();
            } else {
                this.stopListening();
            }
        });
    }

    async checkUserRole() {
        if (!this.currentUser) return;
        
        try {
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
            this.isAdmin = userDoc.exists && userDoc.data().role === 'admin';
        } catch (error) {
            console.log('Error checking user role:', error);
            this.isAdmin = false;
        }
    }

    startListening() {
        if (!this.currentUser) return;

        // Listen for new orders (for admins)
        if (this.isAdmin) {
            this.listenForNewOrders();
        }

        // Listen for order status changes (for users)
        this.listenForOrderStatusChanges();
    }

    listenForNewOrders() {
        const ordersQuery = query(
            collection(db, 'orders'),
            orderBy('timestamp', 'desc'),
            limit(1)
        );

        onSnapshot(ordersQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const order = change.doc.data();
                    const orderTime = order.timestamp?.toDate();
                    
                    // Only notify for new orders (not initial load)
                    if (this.lastOrderTime && orderTime > this.lastOrderTime) {
                        this.showNotification(
                            'New Order Received!',
                            `Order #${order.orderNumber || order.id?.substring(0, 8)} - ${order.totalAmount}`,
                            'order'
                        );
                    }
                    
                    if (orderTime) {
                        this.lastOrderTime = orderTime;
                    }
                }
            });
        });
    }

    listenForOrderStatusChanges() {
        if (!this.currentUser) return;

        const userOrdersQuery = query(
            collection(db, 'orders'),
            where('userId', '==', this.currentUser.uid),
            orderBy('timestamp', 'desc')
        );

        onSnapshot(userOrdersQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified') {
                    const order = change.doc.data();
                    const orderId = change.doc.id;
                    const currentStatus = order.status;
                    const lastStatus = this.lastOrderStatusChange.get(orderId);

                    if (lastStatus && lastStatus !== currentStatus) {
                        this.showNotification(
                            'Order Status Updated',
                            `Order #${order.orderNumber || orderId.substring(0, 8)} is now ${currentStatus}`,
                            'status'
                        );
                    }

                    this.lastOrderStatusChange.set(orderId, currentStatus);
                }
            });
        });
    }

    showNotification(title, body, type) {
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: type,
                requireInteraction: false
            });

            // Auto close after 5 seconds
            setTimeout(() => notification.close(), 5000);

            // Handle click
            notification.onclick = () => {
                window.focus();
                if (type === 'order' && this.isAdmin) {
                    window.location.href = 'orders.html';
                } else if (type === 'status') {
                    window.location.href = 'myorders.html';
                }
                notification.close();
            };
        }

        // Show in-app notification
        this.showInAppNotification(title, body, type);
        
        // Update notification bell
        this.updateNotificationBell();
    }

    showInAppNotification(title, body, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'order' ? 'success' : 'info'} notification-toast`;
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            z-index: 10000;
            max-width: 300px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            cursor: pointer;
        `;
        
        notification.innerHTML = `
            <strong>${title}</strong><br>
            <small>${body}</small>
            <button type="button" class="btn-close" style="float: right;"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Handle click
        notification.onclick = () => {
            if (type === 'order' && this.isAdmin) {
                window.location.href = 'orders.html';
            } else if (type === 'status') {
                window.location.href = 'myorders.html';
            }
        };
        
        // Handle close button
        notification.querySelector('.btn-close').onclick = (e) => {
            e.stopPropagation();
            this.removeNotification(notification);
        };
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);
    }

    removeNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    updateNotificationBell() {
        const bellBtn = document.getElementById('notification-btn');
        const countBadge = document.getElementById('notification-count');
        
        if (bellBtn) {
            bellBtn.classList.add('has-notifications');
            setTimeout(() => {
                bellBtn.classList.remove('has-notifications');
            }, 500);
        }
        
        // You can implement a counter here if needed
        // For now, just show the animation
    }

    stopListening() {
        this.lastOrderTime = null;
        this.lastOrderStatusChange.clear();
        this.isAdmin = false;
        this.currentUser = null;
    }
}

// Initialize notification manager
const notificationManager = new NotificationManager();

// Add notification bell click handler
document.addEventListener('DOMContentLoaded', () => {
    const notificationBtn = document.getElementById('notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            // Toggle notification permission or show notification center
            if ('Notification' in window) {
                if (Notification.permission === 'default') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            notificationManager.showInAppNotification(
                                'Notifications Enabled!', 
                                'You will now receive order updates', 
                                'info'
                            );
                        }
                    });
                } else if (Notification.permission === 'granted') {
                    // Show notification status
                    notificationManager.showInAppNotification(
                        'Notifications Active', 
                        'You are receiving notifications', 
                        'info'
                    );
                } else {
                    alert('Notifications are blocked. Please enable them in your browser settings.');
                }
            }
        });
    }
});

export default notificationManager;