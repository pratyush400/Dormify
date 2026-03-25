// src/hooks/useUser.ts
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { auth, db } from '../services/firebase';

export type UserProfile = {
  uid: string;
  fname: string;
  lname: string;
  username: string;
  email: string;
  hall: string;
  college: string;
  avatarUrl: string;
  createdAt: any;
  lastSeen: any;
  isOnline: boolean;
};

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Handle Authentication and Data Fetching
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Listen for data, but don't trigger writes inside here
      return onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
        if (snap.exists()) {
          setUser({ uid: firebaseUser.uid, ...snap.data() } as UserProfile);
        }
        setLoading(false);
      });
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    const updateStatus = async (online: boolean) => {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          isOnline: online,
          lastSeen: serverTimestamp(),
        }, { merge: true });
      } catch (e) { /* ignore */ }
    };

    updateStatus(true);

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      updateStatus(nextAppState === 'active');
    });

    return () => {
      subscription.remove();
      updateStatus(false);
    };
  }, [user?.uid]); // Only restarts if the USER changes, not when the user's DATA changes

  return { user, loading };
}
