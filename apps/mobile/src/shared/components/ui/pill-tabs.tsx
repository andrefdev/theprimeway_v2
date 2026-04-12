import { cn } from '@/shared/utils';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@ui/text';

export interface PillTab {
  key: string;
  label: string;
}

interface PillTabsProps {
  tabs: PillTab[];
  activeKey: string;
  onTabPress: (key: string) => void;
  className?: string;
}

export function PillTabs({ tabs, activeKey, onTabPress, className }: PillTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-4"
      className={cn('-mx-4', className)}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            className={cn(
              'rounded-full px-4 py-2',
              isActive
                ? 'bg-primary'
                : 'bg-muted active:bg-muted/80'
            )}
          >
            <Text
              className={cn(
                'text-sm font-medium',
                isActive ? 'text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
