import { useEffect, useState, type ReactNode } from 'react';
import { View, Pressable, AppState } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Fingerprint, KeyRound } from 'lucide-react-native';
import { useBiometricStore } from '@/shared/stores/biometricStore';
import { useAuthStore } from '@/shared/stores/authStore';
import { authenticateBiometric } from '../services/biometric';
interface Props {
  children: ReactNode;
}

export function BiometricGate({ children }: Props) {
  const enabled = useBiometricStore((s) => s.enabled);
  const locked = useBiometricStore((s) => s.locked);
  const hydrated = useBiometricStore((s) => s.hydrated);
  const hydrate = useBiometricStore((s) => s.hydrate);
  const lock = useBiometricStore((s) => s.lock);
  const unlock = useBiometricStore((s) => s.unlock);
  const [authing, setAuthing] = useState(false);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') lock();
    });
    return () => sub.remove();
  }, [lock]);

  const tryUnlock = async () => {
    if (authing) return;
    setAuthing(true);
    const ok = await authenticateBiometric('Unlock The Prime Way');
    setAuthing(false);
    if (ok) unlock();
  };

  useEffect(() => {
    if (enabled && locked && hydrated) tryUnlock();
  }, [enabled, locked, hydrated]);

  if (!hydrated) return null;
  if (!enabled || !locked) return <>{children}</>;

  const usePassword = async () => {
    await useAuthStore.getState().logout();
  };

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background px-6">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Icon as={Fingerprint} size={40} className="text-primary" />
      </View>
      <Text className="text-xl font-bold text-foreground">App locked</Text>
      <Pressable
        onPress={tryUnlock}
        disabled={authing}
        className="rounded-md bg-primary px-6 py-3"
      >
        <Text className="text-sm font-medium text-primary-foreground">
          {authing ? 'Unlocking...' : 'Unlock'}
        </Text>
      </Pressable>
      <Pressable
        onPress={usePassword}
        className="flex-row items-center gap-2 px-4 py-2"
      >
        <Icon as={KeyRound} size={14} className="text-muted-foreground" />
        <Text className="text-sm text-muted-foreground underline">
          Use password instead
        </Text>
      </Pressable>
    </View>
  );
}
