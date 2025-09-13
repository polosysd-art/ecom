# Ecommerce Template Setup Guide

## Quick Setup for Customers

### 1. Firebase Configuration
1. Create Firebase project at `console.firebase.google.com`
2. Enable Firestore Database (Production mode)
3. Enable Authentication (Email/Password)
4. Get config keys from Project Settings

### 2. Update Config File
Edit `frontend/config/firebase-config.js` with your Firebase keys:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other keys
};
```

### 3. Set Admin Emails
Add admin emails in these 3 files:
- `gateway.js` (line 11)
- `frontend/js/store.js` (line 6)
- `backend/admin/auth-check.js` (line 5)

```javascript
const ADMIN_EMAILS = [
    'admin@yourstore.com',
    'owner@yourstore.com'
];
```

### 4. Create Admin Account
1. Go to your deployed site
2. Sign up with admin email
3. Login to access admin dashboard

### 5. Add Products
1. Login as admin
2. Go to Admin Dashboard
3. Add products through the interface

### 6. Deploy
Upload entire folder to:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting

## File Structure
```
ecommerce-template/
├── index.html              # Main login gateway
├── gateway.js             # Authentication logic
├── frontend/              # Customer store
│   ├── store.html        # Main store page
│   ├── products.html     # Product catalog
│   ├── cart.html         # Shopping cart
│   └── config/           # Firebase config
└── backend/admin/        # Admin dashboard
    ├── index.html        # Admin panel
    └── login.html        # Admin login
```

## Customer Gets
- Complete ecommerce store
- Admin dashboard
- User authentication
- Order management
- Free hosting ready