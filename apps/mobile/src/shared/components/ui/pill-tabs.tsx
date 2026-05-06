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
              'rounded-2xl px-4 py-2.5',
              isActive
                ? 'bg-primary shadow-sm shadow-primary/20'
                : 'bg-card border border-border/70 active:bg-muted'
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
