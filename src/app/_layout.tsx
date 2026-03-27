// src/app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { auth } from '../services/firebase';

export default function RootLayout() {
  useNotifications();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inIndex = segments[0] === undefined;

    if (user && (inAuthGroup || inIndex)) {
      // Logged in but stuck on login or index → go to app
      router.replace('/(tabs)/home');
    } else if (!user && (inTabsGroup || inIndex)) {
      // Logged out but in app or index → go to login
      router.replace('/(auth)/login');
    }
    // Any other case (modal, listing, etc.) — don't redirect
  }, [user, loading, segments]);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modal" />
      <Stack.Screen name="listing" />
    </Stack>
  );
}