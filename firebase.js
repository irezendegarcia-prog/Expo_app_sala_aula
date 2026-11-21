// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACPUee4u-gNWltAG2AF3c0t5dOq57EFME",
  databaseURL:"https://dev-italo-default-rtdb.firebaseio.com/",
  authDomain: "dev-italo.firebaseapp.com",
  projectId: "dev-italo",
  storageBucket: "dev-italo.firebasestorage.app",
  messagingSenderId: "35481369385",
  appId: "1:35481369385:web:f1621e66f3796b9808d538",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app); 
export default auth;