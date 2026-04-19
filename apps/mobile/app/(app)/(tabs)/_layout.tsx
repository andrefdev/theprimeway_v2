import { Tabs } from 'expo-router';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon } from '@/shared/components/ui/icon';
import {
  House,
  CheckSquare,
  Flame,
  LayoutGrid,
  Sparkles,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { THEME } from '../../../lib/theme';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { Pressable, View } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '@/shared/utils/cn';
import type { LucideIcon } from 'lucide-react-native';

const TAB_ICONS: Record<string, LucideIcon> = {
  index: House,
  tasks: CheckSquare,
  habits: Flame,
  goals: LayoutGrid,
  ai: Sparkles,
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colorScheme } = useColorScheme();
  const theme = THEME[colorScheme ?? 'dark'];

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ backgroundColor: theme.background }}
    >
      <View
        className="flex-row border-t border-border"
        style={{ paddingTop: 8, paddingBottom: 4 }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = (options.tabBarLabel ?? options.title ?? route.name) as string;
          const isFocused = state.index === index;
          const TabIcon = TAB_ICONS[route.name] ?? LayoutGrid;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              className="flex-1 items-center gap-1 py-1"
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            >
              <Icon
                as={TabIcon}
                size={22}
                color={isFocused ? theme.primary : theme.mutedForeground}
              />
              {isFocused && (
                <View className="h-1 w-1 rounded-full" style={{ backgroundColor: theme.primary }} />
              )}
              <Text
                className={cn(
                  'text-[10px] font-semibold',
                  isFocused ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function TabLayout() {
  const { t } = useTranslation('navigation');

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: t('home') }} />
      <Tabs.Screen name="tasks" options={{ title: t('tasks') }} />
      <Tabs.Screen name="habits" options={{ title: t('habits') }} />
      <Tabs.Screen name="goals" options={{ title: t('goals'), popToTopOnBlur: true }} />
      <Tabs.Screen name="ai" options={{ title: t('ai') }} />
    </Tabs>
  );
}
