// Database Functions - DO NOT EDIT
import { db, auth } from '../config/firebase-config.js';
import { collection, addDoc, getDocs, query, where, orderBy, onSnapshot, doc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// Add product to database
export async function addProduct(product) {
  try {
    const docRef = await addDoc(collection(db, "products"), product);
    return docRef.id;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
}

// Get all products
export async function getProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    return products;
  } catch (error) {
    console.error("Error getting products:", error);
    throw error;
  }
}

// Add order to database
export async function addOrder(order) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const orderData = {
      ...order,
      userId: user.uid,
      timestamp: new Date(),
      status: 'pending'
    };
    
    const docRef = await addDoc(collection(db, "orders"), orderData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding order:", error);
    throw error;
  }
}

// Get user orders
export async function getUserOrders() {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const q = query(
      collection(db, "orders"), 
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    return orders;
  } catch (error) {
    console.error("Error getting orders:", error);
    throw error;
  }
}

// Real-time listeners for global updates
export function setupGlobalListeners() {
    
    // Listen for store settings changes
    onSnapshot(doc(db, 'settings', 'store'), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (window.navigation) {
                window.navigation.updateStoreName(data.storeName || 'Store');
            }
        }
    });
    
    // Listen for page settings changes
    onSnapshot(doc(db, 'settings', 'pages'), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (window.navigation) {
                window.navigation.updatePageTexts(data);
            }
        }
    });
}

// Export database instance
export { db };