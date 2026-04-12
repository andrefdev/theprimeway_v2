import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Stack, usePathname, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/shared/components/ui/icon';
import { PillTabs } from '@/shared/components/ui/pill-tabs';
import { Plus } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { TaskFormSheet } from '@features/tasks/components/TaskFormSheet';
import { PageHeader } from '@features/personalization/components/PageHeader';

function TasksHeader({ onAddTask }: { onAddTask: () => void }) {
  const { t } = useTranslation('navigation');
  const { t: tTasks } = useTranslation('features.tasks');
  const pathname = usePathname();

  const TABS = [
    { key: 'today', label: t('today') },
    { key: 'weekly', label: t('weeklyPlan') },
    { key: 'all', label: t('all') },
    { key: 'focus', label: t('focus') },
  ];

  const getActiveTab = useCallback(() => {
    if (pathname.includes('/focus')) return 'focus';
    if (pathname.includes('/weekly')) return 'weekly';
    if (pathname.includes('/all')) return 'all';
    return 'today';
  }, [pathname]);

  const activeTab = getActiveTab();

  const handleTabPress = useCallback((key: string) => {
    const routes: Record<string, string> = {
      today: '/(app)/(tabs)/tasks/today',
      weekly: '/(app)/(tabs)/tasks/weekly',
      all: '/(app)/(tabs)/tasks/all',
      focus: '/(app)/(tabs)/tasks/focus',
    };
    router.replace(routes[key] as never);
  }, []);

  return (
    <>
      <PageHeader
        sectionId="tasks"
        title={tTasks('title')}
        actions={
          <Pressable
            onPress={onAddTask}
            className="h-9 w-9 items-center justify-center rounded-full bg-primary active:bg-primary-hover"
            hitSlop={8}
          >
            <Icon as={Plus} size={18} className="text-primary-foreground" />
          </Pressable>
        }
      />
      <View className="px-4 py-2">
        <PillTabs tabs={TABS} activeKey={activeTab} onTabPress={handleTabPress} />
      </View>
    </>
  );
}

export default function TasksLayout() {
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <TasksHeader onAddTask={() => setShowCreateSheet(true)} />
      <View style={{ flex: 1 }} collapsable={false}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="today" />
          <Stack.Screen name="weekly" />
          <Stack.Screen name="all" />
          <Stack.Screen name="focus" />
          <Stack.Screen name="new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </View>
      <TaskFormSheet isOpen={showCreateSheet} onClose={() => setShowCreateSheet(false)} />
    </SafeAreaView>
  );
}
