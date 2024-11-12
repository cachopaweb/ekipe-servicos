// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_FIRE_API_KEY,
  authDomain: process.env.NEXT_FIRE_AUT_DOMAIN,
  databaseURL: process.env.NEXT_FIRE_DATABASE_URL,
  projectId: process.env.NEXT_FIRE_PROJECT_ID,
  storageBucket: process.env.NEXT_FIRE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_FIRE_MENSAGING_SENDER_ID,
  appId: process.env.NEXT_FIRE_APP_ID
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);