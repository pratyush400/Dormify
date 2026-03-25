// src/app/_layout.tsx
import { Stack } from 'expo-router';
import { useNotifications } from '../hooks/useNotifications';

export default function RootLayout() {
  useNotifications(); 
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