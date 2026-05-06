import { Tabs } from 'expo-router';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon } from '@/shared/components/ui/icon';
import {
  Sparkles,
  BarChart3,
  SlidersHorizontal,
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
  ai: Sparkles,
  index: BarChart3,
  manual: SlidersHorizontal,
};

const VISIBLE_TABS = ['ai', 'index', 'manual'] as const;

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colorScheme } = useColorScheme();
  const theme = THEME[colorScheme ?? 'dark'];

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ backgroundColor: theme.background }}
    >
      <View
        className="mx-5 mb-2 flex-row rounded-3xl border border-border/70 bg-card px-1.5 shadow-sm shadow-black/5"
        style={{ paddingTop: 6, paddingBottom: 6 }}
      >
        {state.routes
          .filter((route) => VISIBLE_TABS.includes(route.name as (typeof VISIBLE_TABS)[number]))
          .map((route) => {
          const { options } = descriptors[route.key];
          const label = (options.tabBarLabel ?? options.title ?? route.name) as string;
          const isFocused = state.routes[state.index]?.key === route.key;
          const TabIcon = TAB_ICONS[route.name] ?? SlidersHorizontal;

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
              className={cn(
                'flex-1 items-center gap-1 rounded-2xl py-2',
                isFocused && 'bg-primary'
              )}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            >
              <Icon
                as={TabIcon}
                size={20}
                color={isFocused ? theme.primaryForeground : theme.mutedForeground}
              />
              <Text
                className={cn(
                  'text-[10px] font-semibold',
                  isFocused ? 'text-primary-foreground' : 'text-muted-foreground'
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
      initialRouteName="ai"
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="ai" options={{ title: t('ai') }} />
      <Tabs.Screen name="index" options={{ title: t('progress') }} />
      <Tabs.Screen name="manual" options={{ title: t('manual') }} />
    </Tabs>
  );
}
