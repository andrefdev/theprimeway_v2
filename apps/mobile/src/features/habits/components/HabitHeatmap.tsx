import { View } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { useMemo } from 'react';
import { format, subDays, startOfDay } from 'date-fns';

interface Log {
  date: string;
  completedCount: number;
}

interface Props {
  logs?: Log[];
  targetFrequency: number;
  color?: string;
  weeks?: number;
}

function shade(color: string, intensity: number): string {
  if (intensity === 0) return 'rgba(148, 163, 184, 0.12)';
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const alpha = Math.min(1, 0.25 + intensity * 0.75);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function HabitHeatmap({ logs = [], targetFrequency, color = '#6366f1', weeks = 13 }: Props) {
  const grid = useMemo(() => {
    const today = startOfDay(new Date());
    const totalDays = weeks * 7;
    const logMap = new Map<string, number>();
    logs.forEach((l) => {
      const key = format(startOfDay(new Date(l.date)), 'yyyy-MM-dd');
      logMap.set(key, (logMap.get(key) ?? 0) + l.completedCount);
    });

    const cells: { date: Date; intensity: number; completed: number }[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = subDays(today, i);
      const key = format(d, 'yyyy-MM-dd');
      const completed = logMap.get(key) ?? 0;
      const intensity = Math.min(1, completed / Math.max(1, targetFrequency));
      cells.push({ date: d, intensity, completed });
    }

    const columns: typeof cells[] = [];
    for (let w = 0; w < weeks; w++) {
      columns.push(cells.slice(w * 7, w * 7 + 7));
    }
    return columns;
  }, [logs, targetFrequency, weeks]);

  const totalCompleted = logs.reduce((sum, l) => sum + l.completedCount, 0);

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold text-slate-500">Last {weeks} weeks</Text>
        <Text className="text-xs text-muted-foreground">{totalCompleted} completions</Text>
      </View>
      <View className="flex-row gap-[2px]">
        {grid.map((column, ci) => (
          <View key={ci} className="gap-[2px]">
            {column.map((cell, ri) => (
              <View
                key={ri}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: shade(color, cell.intensity),
                }}
              />
            ))}
          </View>
        ))}
      </View>
      <View className="flex-row items-center justify-end gap-1">
        <Text className="text-[10px] text-muted-foreground">Less</Text>
        {[0, 0.25, 0.5, 0.75, 1].map((i) => (
          <View
            key={i}
            style={{
              width: 9,
              height: 9,
              borderRadius: 2,
              backgroundColor: shade(color, i),
            }}
          />
        ))}
        <Text className="text-[10px] text-muted-foreground">More</Text>
      </View>
    </View>
  );
}
