// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCj27sjYIGm2_eltCOprTeUY8xDdpeXgJo",
  authDomain: "marina-marketplace.firebaseapp.com",
  projectId: "marina-marketplace",
  storageBucket: "marina-marketplace.firebasestorage.app",
  messagingSenderId: "177731162717",
  appId: "1:177731162717:web:41c5060dd2023d1390b3b4",
  measurementId: "G-LWCJS4RYYH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
