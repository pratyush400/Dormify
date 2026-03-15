// src/hooks/useUser.ts
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { AppState } from 'react-native';

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

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const unsubDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
        if (snap.exists()) {
          setUser({ uid: firebaseUser.uid, ...snap.data() } as UserProfile);
        }
        setLoading(false);
      });

      const updateOnlineStatus = async (online: boolean) => {
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            isOnline: online,
            lastSeen: serverTimestamp(),
          }, { merge: true });
        } catch (e) {
          // silently fail
        }
      };

      const appStateSub = AppState.addEventListener('change', (state) => {
        updateOnlineStatus(state === 'active');
      });

      updateOnlineStatus(true);

      return () => {
        unsubDoc();
        appStateSub.remove();
        updateOnlineStatus(false);
      };
    });

    return () => unsubAuth();
  }, []);

  return { user, loading };
}