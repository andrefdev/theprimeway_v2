import { View, Pressable, ScrollView } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Card, CardContent } from '@/shared/components/ui/card';
import { PillTabs } from '@/shared/components/ui/pill-tabs';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageHeader } from '@features/personalization/components/PageHeader';
import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, getDaysInMonth, getDay } from 'date-fns';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from '@/shared/hooks/useTranslation';
import Animated, { FadeInDown } from 'react-native-reanimated';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarScreen() {
  const { t } = useTranslation('features.calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('month');

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = getDay(startOfMonth(currentMonth));
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <PageHeader sectionId="calendar" title={t('title')} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
          {days.map((day) => (
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
            </Pressable>
          ))}
        </View>

        {/* Selected Date Events */}
        <Animated.View entering={FadeInDown.duration(300)} className="mt-4 px-4">
          <Text className="mb-3 text-lg font-bold text-foreground">
            {format(selectedDate, 'EEEE, MMMM d')}
          </Text>

          <Card>
            <CardContent className="items-center py-8">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Icon as={CalendarIcon} size={20} className="text-muted-foreground" />
              </View>
              <Text className="mt-3 text-sm font-medium text-muted-foreground">
                {t('events.noEvents')}
              </Text>
              <Text className="mt-1 text-xs text-muted-foreground">
                Connect Google Calendar to see events
              </Text>
            </CardContent>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
