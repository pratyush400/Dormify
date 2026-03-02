// src/hooks/useUser.ts
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';

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

      // Real-time listener on user doc
      const unsubDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
        if (snap.exists()) {
          setUser(snap.data() as UserProfile);
        }
        setLoading(false);
      });

      return () => unsubDoc();
    });

    return () => unsubAuth();
  }, []);

  return { user, loading };
}