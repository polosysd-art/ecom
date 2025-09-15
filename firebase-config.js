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

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);