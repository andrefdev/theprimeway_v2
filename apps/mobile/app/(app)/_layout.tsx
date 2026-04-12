import { View } from 'react-native';
import { useAuthStore } from '@/shared/stores/authStore';
import { Redirect, Stack } from 'expo-router';
import { CelebrationOverlay } from '@/features/gamification/components/CelebrationOverlay';

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View className="flex-1">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notes/index" />
        <Stack.Screen name="notes/[id]" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="ai" />
        <Stack.Screen name="pomodoro" options={{ presentation: 'modal' }} />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="subscription" />
        <Stack.Screen name="kyc" />
        <Stack.Screen name="customize-section" options={{ presentation: 'modal' }} />
        <Stack.Screen name="alignment-setup" />
        <Stack.Screen name="notifications" />
      </Stack>
      <CelebrationOverlay />
    </View>
  );
}
