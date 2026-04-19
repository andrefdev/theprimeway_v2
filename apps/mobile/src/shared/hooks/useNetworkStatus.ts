import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useMutationState, useIsRestoring } from '@tanstack/react-query';

interface NetworkStatus {
  isOnline: boolean;
  isRestoring: boolean;
  pendingMutations: number;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);
  const isRestoring = useIsRestoring();

  useEffect(() => {
    let cancelled = false;
    NetInfo.fetch().then((state) => {
      if (!cancelled) setIsOnline(!!state.isConnected);
    });
    const unsub = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const pending = useMutationState({
    filters: { status: 'pending' },
  });
  const paused = useMutationState({
    filters: { predicate: (m) => m.state.isPaused },
  });

  return {
    isOnline,
    isRestoring,
    pendingMutations: pending.length + paused.length,
  };
}
