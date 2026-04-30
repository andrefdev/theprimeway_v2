import { View, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '@/shared/components/layout/Header';
import { BrainCaptureCard } from '@/features/brain/components/BrainCaptureCard';
import { BrainEntryCard } from '@/features/brain/components/BrainEntryCard';
import { useBrainFeed } from '@/features/brain/hooks/useBrain';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function BrainScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useBrainFeed();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Brain" showBack />
      {isLoading ? (
        <LoadingOverlay />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          ListHeaderComponent={
            <View className="mb-4">
              <BrainCaptureCard />
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title="No entries yet"
              description="Capture your first thought above"
            />
          }
          renderItem={({ item }) => (
            <BrainEntryCard
              entry={item}
              onPress={(e) => router.push(`/(app)/brain/${e.id}` as any)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      )}
    </SafeAreaView>
  );
}
