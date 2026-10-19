import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDh7_q2lUWFfuXXLE_9IZZnLh_G9igXnOs",
  authDomain: "events-calendar-app-346c9.firebaseapp.com",
  projectId: "events-calendar-app-346c9",
  storageBucket: "events-calendar-app-346c9.firebasestorage.app",
  messagingSenderId: "464219301305",
  appId: "1:464219301305:web:8d1666929de85651e5c268"
};

// אתחול החיבור לפיירבייס
const app = initializeApp(firebaseConfig);

// הפעלת מסד הנתונים וייצוא שלו כדי שנוכל לשמור ולשלוף אירועים
export const db = getFirestore(app);