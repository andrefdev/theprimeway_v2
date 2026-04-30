import { ScrollView, View, Pressable } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { format, parseISO, isSameDay } from 'date-fns';
import type { CalendarEvent } from '@shared/types/models';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface Props {
  date: Date;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
}

export function CalendarDayView({ date, events, onEventPress }: Props) {
  const dayEvents = events.filter((e) => isSameDay(parseISO(e.startDate), date));

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-2">
      <Text className="mb-3 text-base font-bold text-foreground">
        {format(date, 'EEEE, MMMM d')}
      </Text>
      {HOURS.map((hour) => {
        const hourEvents = dayEvents.filter(
          (e) => !e.isAllDay && parseISO(e.startDate).getHours() === hour
        );
        return (
          <View
            key={hour}
            className="flex-row border-t border-border py-2"
          >
            <Text className="w-12 text-2xs text-muted-foreground">
              {hour.toString().padStart(2, '0')}:00
            </Text>
            <View className="flex-1 gap-1">
              {hourEvents.length === 0 ? (
                <View className="h-4" />
              ) : (
                hourEvents.map((ev) => (
                  <Pressable
                    key={ev.id}
                    onPress={() => onEventPress(ev)}
                    className="rounded-md bg-primary/10 px-2 py-1"
                  >
                    <Text className="text-xs font-semibold text-foreground">
                      {ev.title}
                    </Text>
                    <Text className="text-2xs text-muted-foreground">
                      {format(parseISO(ev.startDate), 'HH:mm')} –{' '}
                      {format(parseISO(ev.endDate), 'HH:mm')}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
