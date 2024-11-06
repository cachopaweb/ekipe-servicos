// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPUzjbF_GyPTf7V0_NTRy2Le_cbY1Kjm8",
  authDomain: "jtibearl.firebaseapp.com",
  databaseURL: "https://jtibearl.firebaseio.com",
  projectId: "jtibearl",
  storageBucket: "jtibearl.appspot.com",
  messagingSenderId: "759004956094",
  appId: "1:759004956094:web:82f0ba40bd494adf2065ef"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);