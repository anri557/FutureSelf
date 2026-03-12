import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCMUxGvlKipADkFk7ZotAwm0mu-3fRJZK8",
  authDomain: "futureself-adf2b.firebaseapp.com",
  projectId: "futureself-adf2b",
  storageBucket: "futureself-adf2b.firebasestorage.app",
  messagingSenderId: "935081701805",
  appId: "1:935081701805:web:d9cba2f94affa82db53124"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);