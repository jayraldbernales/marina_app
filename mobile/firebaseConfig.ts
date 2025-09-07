// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your Firebase web config (from Firebase console → Project Settings → General → SDK setup)
const firebaseConfig = {
  apiKey: "AIzaSyCj27sjYIGm2_eltCOprTeUY8xDdpeXgJo",
  authDomain: "marina-marketplace.firebaseapp.com",
  projectId: "marina-marketplace",
  storageBucket: "marina-marketplace.firebasestorage.app",
  messagingSenderId: "177731162717",
  appId: "1:177731162717:web:41c5060dd2023d1390b3b4",
  measurementId: "G-LWCJS4RYYH",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
