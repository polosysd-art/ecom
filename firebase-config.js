// Firebase Configuration - Customers edit ONLY this file
const firebaseConfig = {
  apiKey: "AIzaSyBsdPghRmOsLX7JIj-T8IYF4bRp-KxQAPc",
  authDomain: "cybee-ca5a2.firebaseapp.com",
  projectId: "cybee-ca5a2",
  storageBucket: "cybee-ca5a2.firebasestorage.app",
  messagingSenderId: "215321650697",
  appId: "1:215321650697:web:d0bbf35f6861a891c9bad8"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';

let app, db, auth, storage;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
} catch (error) {
    console.error('Firebase initialization failed:', error);
    throw new Error('Failed to initialize Firebase. Please check your configuration.');
}

export { db, auth, storage };