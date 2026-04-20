import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkEen4W9SOBs_1e2KUpzQfSjgbq9MVYP4",
  authDomain: "cross-95cd7.firebaseapp.com",
  projectId: "cross-95cd7",
  storageBucket: "cross-95cd7.firebasestorage.app",
  messagingSenderId: "768057449899",
  appId: "1:768057449899:web:65a17a6c6bbad5c2d086ee",
  measurementId: "G-0ST3L4TVNZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider();
