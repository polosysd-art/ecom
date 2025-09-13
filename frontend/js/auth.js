// Authentication Functions - DO NOT EDIT
import { auth } from '../config/firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// Sign up new user
export async function signUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
}

// Sign in user
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
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