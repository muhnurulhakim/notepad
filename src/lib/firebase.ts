import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAfC40iz2K3PtYZ1liYicYyTmNQ-IovWOw",
  authDomain: "notepad-kreator.firebaseapp.com",
  databaseURL: "https://notepad-kreator-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "notepad-kreator",
  storageBucket: "notepad-kreator.firebasestorage.app",
  messagingSenderId: "271109626136",
  appId: "1:271109626136:web:70a5fbd6d9c86db1be266d",
  measurementId: "G-YF1FGZ12G5",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
export const database = getDatabase(app);