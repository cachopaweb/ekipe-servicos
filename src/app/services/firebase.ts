// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";

// Your web app's Firebase configuration com fallbacks para o projeto ekipe-servicos
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIRE_API_KEY || "AIzaSyA1FP8gDoyushVj4Ue18lyAtqjnbsNBr-U",
  authDomain: process.env.NEXT_PUBLIC_FIRE_AUT_DOMAIN || "ekipe-servicos.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIRE_PROJECT_ID || "ekipe-servicos",
  storageBucket: process.env.NEXT_PUBLIC_FIRE_STORAGE_BUCKET || "ekipe-servicos.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIRE_MENSAGING_SENDER_ID || "461312302607",
  appId: process.env.NEXT_PUBLIC_FIRE_APP_ID || "1:461312302607:web:558504c8c565a0613f4d7a",
};

// Initialize Firebase (garante singleton no Next.js)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
