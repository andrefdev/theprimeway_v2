import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/shared/components/layout/Header';
import { HabitsAnalytics } from '@/features/habits/components/HabitsAnalytics';

export default function HabitsAnalyticsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Analytics" showBack />
      <HabitsAnalytics />
    </SafeAreaView>
  );
}
