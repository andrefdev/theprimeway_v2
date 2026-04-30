import { View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw, Link2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageHeader } from '@features/personalization/components/PageHeader';
import { useState, useMemo } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  getDaysInMonth,
  getDay,
  startOfDay,
  endOfDay,
  isSameDay,
  parseISO,
} from 'date-fns';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from '@/shared/hooks/useTranslation';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  useCalendarAccounts,
  useCalendarEvents,
  useSyncCalendar,
  useDeleteCalendarEvent,
} from '@features/calendar/hooks/useCalendar';
import { useGoogleCalendarOAuth } from '@features/calendar/hooks/useGoogleCalendarOAuth';
import { EventQuickView } from '@features/calendar/components/EventQuickView';
import { EventEditDialog } from '@features/calendar/components/EventEditDialog';
import { CalendarWeekView } from '@features/calendar/components/CalendarWeekView';
import { CalendarDayView } from '@features/calendar/components/CalendarDayView';
import { toast } from '@/shared/lib/toast';
import type { CalendarEvent } from '@shared/types/models';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type ViewMode = 'month' | 'week' | 'day';

export default function CalendarScreen() {
  const { t } = useTranslation('features.calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [quickEvent, setQuickEvent] = useState<CalendarEvent | null>(null);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const deleteEvent = useDeleteCalendarEvent();

  const handleDelete = (ev: CalendarEvent) => {
    if (!ev.calendarId) {
      toast.error('Missing calendar id');
      return;
    }
    deleteEvent.mutate(
      { calendarId: ev.calendarId, eventId: ev.id },
      {
        onSuccess: () => {
          setQuickEvent(null);
          toast.success('Event deleted');
        },
      }
    );
  };

  const { data: accounts } = useCalendarAccounts();
  const hasConnected = (accounts ?? []).some((a) => a.isConnected);

  const monthRange = useMemo(
    () => ({
      start: startOfMonth(currentMonth).toISOString(),
      end: endOfDay(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)).toISOString(),
    }),
    [currentMonth]
  );

  const { data: events, isLoading: eventsLoading } = useCalendarEvents(
    hasConnected ? monthRange : undefined
  );
  const sync = useSyncCalendar();
  const oauth = useGoogleCalendarOAuth();

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = getDay(startOfMonth(currentMonth));
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, number>();
    (events ?? []).forEach((e) => {
      const d = parseISO(e.startDate);
      if (d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()) {
        map.set(d.getDate(), (map.get(d.getDate()) ?? 0) + 1);
      }
    });
    return map;
  }, [events, currentMonth]);

  const selectedDayEvents = useMemo(() => {
    return (events ?? []).filter((e) => isSameDay(parseISO(e.startDate), selectedDate));
  }, [events, selectedDate]);

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) =>
    day === selectedDate.getDate() &&
    currentMonth.getMonth() === selectedDate.getMonth() &&
    currentMonth.getFullYear() === selectedDate.getFullYear();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <PageHeader sectionId="calendar" title={t('title')} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Connection banner */}
        {!hasConnected && (
          <View className="mx-4 mt-3">
            <Card>
              <CardContent className="gap-3 p-4">
                <View className="flex-row items-center gap-2">
                  <Icon as={Link2} size={16} className="text-primary" />
                  <Text className="text-sm font-semibold text-foreground">
                    Connect Google Calendar
                  </Text>
                </View>
                <Text className="text-xs text-muted-foreground">
                  Sync your events and see them here.
                </Text>
                {oauth.error && (
                  <Text className="text-xs text-destructive">{oauth.error}</Text>
                )}
                <Pressable
                  onPress={() => oauth.connectAccount()}
                  disabled={oauth.isConnecting}
                  className="self-start rounded-md bg-primary px-4 py-2 active:opacity-80"
                >
                  <Text className="text-sm font-medium text-primary-foreground">
                    {oauth.isConnecting ? 'Connecting...' : 'Connect'}
                  </Text>
                </Pressable>
              </CardContent>
            </Card>
          </View>
        )}

        {/* View mode tabs + sync */}
        {hasConnected && (
          <View className="flex-row items-center justify-between gap-2 px-4 pt-2">
            <View className="flex-row gap-1 rounded-full bg-muted p-1">
              {(['month', 'week', 'day'] as ViewMode[]).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setViewMode(m)}
                  className={cn(
                    'rounded-full px-3 py-1',
                    viewMode === m && 'bg-card'
                  )}
                >
                  <Text
                    className={cn(
                      'text-2xs font-semibold capitalize',
                      viewMode === m ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {m}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => sync.mutate()}
              disabled={sync.isPending}
              className="flex-row items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 active:opacity-80"
            >
              <Icon as={RefreshCw} size={12} className="text-foreground" />
              <Text className="text-xs font-medium text-foreground">
                {sync.isPending ? 'Syncing...' : 'Sync'}
              </Text>
            </Pressable>
          </View>
        )}

        {viewMode === 'week' && hasConnected && (
          <View className="mt-2">
            <CalendarWeekView
              anchorDate={selectedDate}
              events={events ?? []}
              onEventPress={setQuickEvent}
            />
          </View>
        )}

        {viewMode === 'day' && hasConnected && (
          <View className="mt-2">
            <CalendarDayView
              date={selectedDate}
              events={events ?? []}
              onEventPress={setQuickEvent}
            />
          </View>
        )}

        {viewMode !== 'month' && <View className="h-8" />}

        {viewMode === 'month' && (
        <>
        {/* Month Navigation */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="h-8 w-8 items-center justify-center rounded-lg bg-muted active:bg-border"
          >
            <Icon as={ChevronLeft} size={18} className="text-foreground" />
          </Pressable>
          <Text className="text-lg font-bold text-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </Text>
          <Pressable
            onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="h-8 w-8 items-center justify-center rounded-lg bg-muted active:bg-border"
          >
            <Icon as={ChevronRight} size={18} className="text-foreground" />
          </Pressable>
        </View>

        {/* Weekday Headers */}
        <View className="flex-row px-2">
          {WEEKDAYS.map((day, i) => (
            <View key={`${day}-${i}`} className="flex-1 items-center py-2">
              <Text className="text-xs font-medium text-muted-foreground">{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View className="flex-row flex-wrap px-2">
          {emptySlots.map((_, i) => (
            <View key={`empty-${i}`} className="h-11 w-[14.28%]" />
          ))}
          {days.map((day) => {
            const count = eventsByDay.get(day) ?? 0;
            return (
              <Pressable
                key={day}
                className="h-11 w-[14.28%] items-center justify-center"
                onPress={() =>
                  setSelectedDate(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                  )
                }
              >
                <View
                  className={cn(
                    'h-9 w-9 items-center justify-center rounded-full',
                    isToday(day) && !isSelected(day) && 'border border-primary',
                    isSelected(day) && 'bg-primary'
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm',
                      isSelected(day)
                        ? 'font-bold text-primary-foreground'
                        : isToday(day)
                          ? 'font-bold text-primary'
                          : 'text-foreground'
                    )}
                  >
                    {day}
                  </Text>
                </View>
                {count > 0 && (
                  <View className="mt-0.5 h-1 w-1 rounded-full bg-primary" />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Selected Date Events */}
        <Animated.View entering={FadeInDown.duration(300)} className="mt-4 px-4 pb-8">
          <Text className="mb-3 text-lg font-bold text-foreground">
            {format(selectedDate, 'EEEE, MMMM d')}
          </Text>

          {eventsLoading ? (
            <Card>
              <CardContent className="items-center py-8">
                <ActivityIndicator size="small" />
              </CardContent>
            </Card>
          ) : selectedDayEvents.length === 0 ? (
            <Card>
              <CardContent className="items-center py-8">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Icon as={CalendarIcon} size={20} className="text-muted-foreground" />
                </View>
                <Text className="mt-3 text-sm font-medium text-muted-foreground">
                  {t('events.noEvents')}
                </Text>
              </CardContent>
            </Card>
          ) : (
            <View className="gap-2">
              {selectedDayEvents.map((ev) => (
                <Pressable key={ev.id} onPress={() => setQuickEvent(ev)}>
                  <Card>
                    <CardContent className="flex-row items-start gap-3 p-3">
                      <View
                        className="mt-1 h-3 w-3 rounded-full"
                        style={{ backgroundColor: ev.color ?? '#6366f1' }}
                      />
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">
                          {ev.title}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {ev.isAllDay
                            ? 'All day'
                            : `${format(parseISO(ev.startDate), 'HH:mm')} – ${format(parseISO(ev.endDate), 'HH:mm')}`}
                        </Text>
                        {ev.description ? (
                          <Text
                            className="mt-1 text-xs text-muted-foreground"
                            numberOfLines={2}
                          >
                            {ev.description}
                          </Text>
                        ) : null}
                      </View>
                    </CardContent>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </Animated.View>
        </>
        )}
      </ScrollView>

      <EventQuickView
        event={quickEvent}
        onClose={() => setQuickEvent(null)}
        onEdit={(ev) => {
          setQuickEvent(null);
          setEditEvent(ev);
        }}
        onDelete={handleDelete}
      />
      <EventEditDialog event={editEvent} onClose={() => setEditEvent(null)} />
    </SafeAreaView>
  );
}
