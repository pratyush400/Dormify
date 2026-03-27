import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
const firebaseConfig = {
  apiKey: 'AIzaSyB8HZVV0Z71bu-arFd52pwrAoQD-MIBgiw',
  authDomain: 'dormify-now.firebaseapp.com',
  projectId: 'dormify-now',
  storageBucket: 'dormify-now.firebasestorage.app',
  messagingSenderId: '283928198587',
  appId: '1:283928198587:web:fe0bfac9fdcc5c90b9989e',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getApps().length === 0
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);
const storage = getStorage(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache(),
});

export { auth, db, storage };
