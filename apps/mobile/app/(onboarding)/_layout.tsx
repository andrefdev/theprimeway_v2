import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="habits" />
      <Stack.Screen name="tasks" />
      <Stack.Screen name="finances" />
      <Stack.Screen name="notes" />
    </Stack>
  );
}
