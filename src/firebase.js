// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtEiPAnWftDNoYCmRaq48DXDQX7zQBhrI",
  authDomain: "membertool-f2bcb.firebaseapp.com",
  databaseURL:
    "https://membertool-f2bcb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "membertool-f2bcb",
  storageBucket: "membertool-f2bcb.appspot.com",
  messagingSenderId: "290989094157",
  appId: "1:290989094157:web:4635f84b10b6162f0f6c44",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
