import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCZ3Lycg-uI3A8k012k_9Dca0AO1lOMO5w",
  authDomain: "filesharer-b8ff3.firebaseapp.com",
  projectId: "filesharer-b8ff3",
  storageBucket: "filesharer-b8ff3.firebasestorage.app",
  messagingSenderId: "847550721612",
  appId: "1:847550721612:web:f8140aeb7b094482104ee9",
  measurementId: "G-DW7HE8C9HB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
