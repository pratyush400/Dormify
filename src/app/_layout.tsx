// src/app/_layout.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import EulaModal from '../components/EulaModal';
import { auth } from '../services/firebase';

export default function RootLayout() {
   const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false); // NEW: The "wait" flag
  const [showEula, setShowEula] = useState(false);
  
  const router = useRouter();
  const segments = useSegments();

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

  if (loading) return;

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

