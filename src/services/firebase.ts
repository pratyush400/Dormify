import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
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

// try/catch is the only reliable way to handle this
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Already initialized — get the existing instance
  auth = getAuth(app);
}

const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache(),
});

const storage = getStorage(app);

export { auth, db, storage };
