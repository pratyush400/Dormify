// src/app/_layout.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import EulaModal from '../components/EulaModal';
import { useNotifications } from '../hooks/useNotifications';
import { auth, db } from '../services/firebase';

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [showEula, setShowEula] = useState(false);

  const router = useRouter();
  useNotifications();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const accepted = await AsyncStorage.getItem('eulaAccepted');
        if (!accepted) {
          setShowEula(true);
          setLoading(false);
          return;
        }
        const userSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
        const onboardingComplete = userSnapshot.data()?.onboardingComplete;
        setLoading(false);
        router.replace(onboardingComplete ? '/(tabs)/home' : '/(auth)/onboard');
      } else {
        setLoading(false);
        router.replace('/(auth)/signup');
      }
    });
    return unsubscribe;
  }, [router]);

  const handleAcceptEula = async () => {
    await AsyncStorage.setItem('eulaAccepted', 'true');
    setShowEula(false);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.replace('/(auth)/signup');
      return;
    }
    const userSnapshot = await getDoc(doc(db, 'users', currentUser.uid));
    const onboardingComplete = userSnapshot.data()?.onboardingComplete;
    router.replace(onboardingComplete ? '/(tabs)/home' : '/(auth)/onboard');
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
        <Stack.Screen name="event" />
      </Stack>
    </>
  );
}
