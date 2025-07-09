// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCmuokCKFdI8lgpLYmeXznPqW06XOm0Sw",
  authDomain: "charade-game-7c565.firebaseapp.com",
  databaseURL: "https://charade-game-7c565-default-rtdb.firebaseio.com",
  projectId: "charade-game-7c565",
  storageBucket: "charade-game-7c565.firebasestorage.app",
  messagingSenderId: "314859166334",
  appId: "1:314859166334:web:bf67f5b41b3e785e8ed62f",
  measurementId: "G-B66W39EK2G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

export { database };
export default app;