import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyB8HZVV0Z71bu-arFd52pwrAoQD-MIBgiw',
  authDomain: 'dormify-now.firebaseapp.com',
  projectId: 'dormify-now',
  storageBucket: 'dormify-now.firebasestorage.app',
  messagingSenderId: '283928198587',
  appId: '1:283928198587:web:fe0bfac9fdcc5c90b9989e',
  measurementId: "G-ZJE7BSN529"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);