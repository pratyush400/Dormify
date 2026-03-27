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

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    setUser(firebaseUser);

    if (firebaseUser) {
      const accepted = await AsyncStorage.getItem('eulaAccepted');
      if (!accepted) {
        setShowEula(true);
        setLoading(false);
        return;
      }
      setLoading(false);
      router.replace('/(tabs)/home');
    } else {
      setLoading(false);
      router.replace('/(auth)/login');
    }
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
