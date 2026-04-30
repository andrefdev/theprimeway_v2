import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '@/shared/components/layout/Header';
import { BrainEntryDetail } from '@/features/brain/components/BrainEntryDetail';

export default function BrainEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Entry" showBack />
      {id ? (
        <BrainEntryDetail entryId={id} onDeleted={() => router.back()} />
      ) : null}
    </SafeAreaView>
  );
}
