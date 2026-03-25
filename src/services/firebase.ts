import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyB8HZVV0Z71bu-arFd52pwrAoQD-MIBgiw',
  authDomain: 'dormify-now.firebaseapp.com',
  projectId: 'dormify-now',
  storageBucket: 'dormify-now.firebasestorage.app',
  messagingSenderId: '283928198587',
  appId: '1:283928198587:web:fe0bfac9fdcc5c90b9989e',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getApps().length === 0
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  : getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);