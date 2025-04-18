// services/firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

// Konfigurasi Firebase kamu
const firebaseConfig = {
  apiKey: "AIzaSyC4Nar2JhEkwI5w3Uxyv_oCAfS28E5DQdE",
  authDomain: "tubesgdg.firebaseapp.com",
  projectId: "tubesgdg",
  storageBucket: "tubesgdg.firebasestorage.app",
  messagingSenderId: "252904716755",
  appId: "1:252904716755:web:45b5894863403d7cac9726"
};

// Inisialisasi aplikasi Firebase
const app = initializeApp(firebaseConfig);

// Menginisialisasi Auth dan Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Menyediakan ekspor untuk digunakan di komponen lain
export { db, auth };
