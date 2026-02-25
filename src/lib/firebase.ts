import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDkM4FvvqWtY9y0V9KGKRRF2gAUwRqWwFA",
  authDomain: "smarter-6047f.firebaseapp.com",
  databaseURL: "https://smarter-6047f-default-rtdb.firebaseio.com",
  projectId: "smarter-6047f",
  storageBucket: "smarter-6047f.firebasestorage.app",
  messagingSenderId: "469346755928",
  appId: "1:469346755928:web:e69a73dac6dc28c148b12d",
  measurementId: "G-GBZWDSGK3H",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

// Initialize analytics only in browser environments that support it
export const initAnalytics = async () => {
  const supported = await isSupported();
  if (supported) {
    return getAnalytics(app);
  }
  return null;
};

// Initialize analytics on load
initAnalytics();

export default app;
