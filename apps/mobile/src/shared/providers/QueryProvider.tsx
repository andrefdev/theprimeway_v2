import {
  QueryClient,
  onlineManager,
  focusManager,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import { useEffect, type ReactNode } from 'react';
import axios from 'axios';
import { toast } from '@/shared/lib/toast';

function extractErrorMessage(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401 || status === 403) return null;
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    return data?.error ?? data?.message ?? error.message ?? 'Network error';
  }
  if (error instanceof Error) return error.message;
  return null;
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only toast if there's already cached data (background refetch failure is loud)
      // or if this is an explicit refetch. Initial loads handled by component-level UI.
      if (query.state.data === undefined) return;
      const msg = extractErrorMessage(error);
      if (msg) toast.error(msg);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      // Skip toast if mutation provided its own onError (avoid double messages)
      if (mutation.options.onError) return;
      const msg = extractErrorMessage(error);
      if (msg) toast.error(msg);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
      retry: (failureCount, error) => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status === 401 || status === 403 || status === 404) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 3,
      networkMode: 'offlineFirst',
    },
  },
});

export { queryClient };

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'theprimeway_query_cache',
  throttleTime: 1000,
});

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    const online = !!state.isConnected;
    setOnline(online);
    if (online) {
      // Drain the mutation queue on reconnect
      queryClient.resumePausedMutations().then(() => {
        queryClient.invalidateQueries();
      });
    }
  });
});

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
}

export function QueryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        dehydrateOptions: {
          // Persist successful query results so data is available immediately
          // on next cold start (even without network).
          shouldDehydrateQuery: (query) => query.state.status === 'success',
          // Persist paused/failed mutations so they survive app restarts and
          // are resumed when the network is back.
          shouldDehydrateMutation: (mutation) =>
            mutation.state.isPaused || mutation.state.status === 'error',
        },
      }}
      onSuccess={() => {
        queryClient.resumePausedMutations();
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
