# Firebase Security Rules

## Required Firestore Rules

Copy these rules to your Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products - readable by everyone, writable by authenticated users
    match /products/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Orders - private to each user
    match /orders/{document} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == request.resource.data.userId);
    }
    
    // Settings - readable by everyone, writable by authenticated users (admins)
    match /settings/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Users collection (if needed)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Gallery - readable by everyone, writable by authenticated users
    match /gallery/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## How to Apply Rules

1. Go to Firebase Console
2. Select your project
3. Go to Firestore Database
4. Click "Rules" tab
5. Replace existing rules with the above
6. Click "Publish"

## What These Rules Do

- **Products**: Everyone can read, only authenticated users can write
- **Orders**: Users can only access their own orders
- **Settings**: Everyone can read, only authenticated users can write
- **Users**: Users can only access their own user data

This allows admins to save settings while keeping data secure.