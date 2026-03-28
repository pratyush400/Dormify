// src/app/_layout.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { DocumentReference, Firestore, doc as firestoreDoc, getDoc as firestoreGetDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import EulaModal from '../components/EulaModal';
import { useNotifications } from '../hooks/useNotifications';
import { auth } from '../services/firebase';

export default function RootLayout() {
  useNotifications();
  const router = useRouter();
  const segments = useSegments();

  const [loading, setLoading] = useState(true); // overall init loading
  const [showEula, setShowEula] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // 1. Add a second useEffect to handle the actual navigation
useEffect(() => {
  if (loading) return; // Don't run until Firebase check is done

  const inAuthGroup = segments[0] === '(auth)';

  if (user && !showEula) {
    // If logged in and EULA is done, go home
    router.replace('/(tabs)/home');
  } else if (!user) {
    // If not logged in, go to login
    router.replace('/(auth)/login');
  }
}, [user, loading, showEula, segments]);

// 2. Simplified onAuthStateChanged
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const accepted = await AsyncStorage.getItem('eulaAccepted');
      if (!accepted) setShowEula(true);
      setUser(firebaseUser);
    } else {
      setUser(null);
    }
    setLoading(false);
  });
  return unsubscribe;
}, []);



const handleAcceptEula = async () => {
  await AsyncStorage.setItem('eulaAccepted', 'true');
  setShowEula(false);
  router.replace('/(tabs)/home');
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
