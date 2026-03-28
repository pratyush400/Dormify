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

  // 1. Listen for Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const accepted = await AsyncStorage.getItem('eulaAccepted');
        if (!accepted) setShowEula(true);
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      
      // Mark as initialized only AFTER the first real check is done
      setIsAuthInitialized(true); 
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2. Handle Navigation only after Initialization
  useEffect(() => {
    // CRITICAL: Stop if auth isn't fully initialized yet
    if (!isAuthInitialized || loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (user && !showEula) {
      // Logged in: Go home if not already there
      if (!inTabsGroup) {
        router.replace('/(tabs)/home');
      }
    } else if (!user) {
      // Logged out: Go to login if not already there
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    }
  }, [user, isAuthInitialized, loading, showEula, segments]);

  // Still show nothing or a splash until initial check is complete
  if (!isAuthInitialized) return null;
  
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

