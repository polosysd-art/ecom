# Ecommerce Template with Admin Dashboard

A complete ecommerce solution with customer frontend and admin backend using Firebase.

## Structure

```
ecommerce-template/
├── frontend/              # Customer-facing store
│   ├── index.html        # Homepage
│   ├── products.html     # Product catalog
│   ├── cart.html         # Shopping cart
│   ├── login.html        # Customer login
│   ├── config/           # Firebase config
│   ├── js/               # Frontend scripts
│   └── css/              # Styles
├── backend/
│   └── admin/            # Admin dashboard
│       ├── index.html    # Admin dashboard
│       ├── login.html    # Admin login
│       ├── admin.js      # Admin functionality
│       └── admin-style.css
└── README.md
```

## Features

### Frontend (Customer Store)
- Product catalog
- Shopping cart
- User authentication
- Order placement
- Responsive design

### Backend (Admin Dashboard)
- Product management (Add/Edit/Delete)
- Order management
- User management
- Real-time updates

## Quick Setup

### 1. Firebase Setup
1. Create Firebase project
2. Enable Firestore Database (Production mode)
3. Enable Authentication (Email/Password)
4. Get config keys

### 2. Update Configuration
Edit `frontend/config/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 3. Create Admin Account
1. Go to `frontend/login.html`
2. Sign up with admin email
3. Use same credentials for admin login

### 4. Add Products
1. Go to `backend/admin/index.html`
2. Login with admin credentials
3. Add products through dashboard

### 5. Deploy
Upload both frontend and backend folders to hosting:
- Frontend: Customer store
- Backend: Admin dashboard

## Access Points

- **Customer Store:** `frontend/index.html`
- **Admin Dashboard:** `backend/admin/index.html`
- **Admin Login:** `backend/admin/login.html`

## Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products readable by everyone, writable by authenticated users (admins)
    match /products/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Orders private to each user
    match /orders/{document} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || request.auth.uid == resource.data.adminId);
    }
  }
}
```

## Customization

### Store Branding
- Edit HTML files to change store name
- Update `frontend/css/style.css` for colors/styling
- Replace logo in navigation

### Admin Features
- Modify `backend/admin/admin.js` for additional functionality
- Add user roles and permissions
- Extend order management features

## For Customers

### Customer Setup (2 minutes):
1. Create Firebase project
2. Update config file
3. Upload to GitHub Pages
4. Create admin account

### Customer Gets:
- Complete ecommerce store
- Admin dashboard
- Order management
- User authentication
- Free hosting

## License

Free to use for commercial and personal projects.