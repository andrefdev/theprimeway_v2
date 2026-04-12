import { Stack } from 'expo-router';

export default function GoalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="roadmap" />
      <Stack.Screen name="reading" />
      <Stack.Screen name="vision" />
      <Stack.Screen name="pillar/[id]" />
      <Stack.Screen name="outcome/[id]" />
      <Stack.Screen name="focus/[id]" />
    </Stack>
  );
}
