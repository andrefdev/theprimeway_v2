import { ScrollView, View, Pressable } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { format, addDays, startOfWeek, parseISO, isSameDay } from 'date-fns';
import { cn } from '@/shared/utils/cn';
import type { CalendarEvent } from '@shared/types/models';

interface Props {
  anchorDate: Date;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
}

export function CalendarWeekView({ anchorDate, events, onEventPress }: Props) {
  const weekStart = startOfWeek(anchorDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2 px-4 py-2">
        {days.map((day) => {
          const dayEvents = events.filter((e) =>
            isSameDay(parseISO(e.startDate), day)
          );
          const isToday = isSameDay(day, new Date());
          return (
            <View
              key={day.toISOString()}
              className={cn(
                'w-44 rounded-xl border border-border bg-card p-2',
                isToday && 'border-primary'
              )}
            >
              <Text
                className={cn(
                  'text-2xs font-semibold uppercase',
                  isToday ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {format(day, 'EEE')}
              </Text>
              <Text className="mb-2 text-base font-bold text-foreground">
                {format(day, 'd')}
              </Text>
              {dayEvents.length === 0 ? (
                <Text className="text-2xs text-muted-foreground">No events</Text>
              ) : (
                dayEvents.slice(0, 4).map((ev) => (
                  <Pressable
                    key={ev.id}
                    onPress={() => onEventPress(ev)}
                    className="mb-1 flex-row items-center gap-1.5 rounded-md bg-muted px-2 py-1"
                  >
                    <View
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: ev.color ?? '#6366f1' }}
                    />
                    <Text
                      numberOfLines={1}
                      className="flex-1 text-2xs text-foreground"
                    >
                      {ev.title}
                    </Text>
                    {!ev.isAllDay && (
                      <Text className="text-2xs text-muted-foreground">
                        {format(parseISO(ev.startDate), 'HH:mm')}
                      </Text>
                    )}
                  </Pressable>
                ))
              )}
              {dayEvents.length > 4 && (
                <Text className="text-2xs text-muted-foreground">
                  +{dayEvents.length - 4} more
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
