import { Stack } from 'expo-router';
export default function ModalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="chat" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="filter" />
    </Stack>
  );
}