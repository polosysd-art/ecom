// Authentication Functions - DO NOT EDIT
import { auth } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// Sign up new user
export async function signUp(email, password) {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Sign up error:', error.code, error.message);
    throw new Error(getFirebaseErrorMessage(error));
  }
}

// Sign in user
export async function signIn(email, password) {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Sign in error:', error.code, error.message);
    throw new Error(getFirebaseErrorMessage(error));
  }
}

// Get user-friendly error messages
function getFirebaseErrorMessage(error) {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'Email is already registered';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/invalid-email':
      return 'Invalid email address';
    default:
      return error.message || 'Authentication failed';
  }
}

// Sign out user
export async function logOut() {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
}

// Check auth state
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}