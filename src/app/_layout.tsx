// src/app/_layout.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User, } from 'firebase/auth';
import { DocumentReference, Firestore, doc as firestoreDoc, getDoc as firestoreGetDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import EulaModal from '../components/EulaModal';
import { useNotifications } from '../hooks/useNotifications';
import { auth, db } from '../services/firebase';

export default function RootLayout() {
  useNotifications();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEula, setShowEula] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const accepted = await AsyncStorage.getItem('eulaAccepted');
        if (!accepted) setShowEula(true);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading || showEula) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inIndex = segments[0] === undefined;
  if (user && (inAuthGroup || inIndex)) {
    // Check if onboarding is done
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      const data = snap.data();
      if (data?.onboardingComplete) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/onboard'); // ← your onboarding route
      }
    });
  } else if (!user && (inTabsGroup || inIndex)) {
      router.replace('/(auth)/login');
    }
  }, [user, loading, segments, showEula]);

  const handleAcceptEula = async () => {
    await AsyncStorage.setItem('eulaAccepted', 'true');
    setShowEula(false);
  };

  if (loading) return null;

  return (
    <>
      <EulaModal visible={showEula} onAccept={handleAcceptEula} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" />
        <Stack.Screen name="listing" />
      </Stack>
    </>
  );
}

function getDoc(docRef: DocumentReference) {
  return firestoreGetDoc(docRef);
}

function doc(database: Firestore, collectionName: string, documentId: string) {
  return firestoreDoc(database, collectionName, documentId);
}

