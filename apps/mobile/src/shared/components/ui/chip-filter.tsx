import { cn } from '@/shared/utils';
import { Pressable, ScrollView } from 'react-native';
import { Text } from '@ui/text';
import { View } from 'react-native';

export interface FilterChip {
  key: string;
  label: string;
  dotColor?: string;
}

interface ChipFilterProps {
  chips: FilterChip[];
  activeKey: string;
  onChipPress: (key: string) => void;
  className?: string;
}

export function ChipFilter({ chips, activeKey, onChipPress, className }: ChipFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-4"
      className={cn('-mx-4', className)}
    >
      {chips.map((chip) => {
        const isActive = chip.key === activeKey;
        return (
          <Pressable
            key={chip.key}
            onPress={() => onChipPress(chip.key)}
            className={cn(
              'flex-row items-center gap-1.5 rounded-full border px-3 py-1.5',
              isActive
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card active:bg-muted'
            )}
          >
            {chip.dotColor && (
              <View
                className={cn('h-2 w-2 rounded-full', chip.dotColor)}
              />
            )}
            <Text
              className={cn(
                'text-xs font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
