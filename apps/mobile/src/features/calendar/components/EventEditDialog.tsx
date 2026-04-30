import { useEffect, useState } from 'react';
import { View, TextInput, Pressable, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { X, Save, Calendar as CalendarIcon } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { useUpdateCalendarEvent } from '../hooks/useCalendar';
import { toast } from '@/shared/lib/toast';
import type { CalendarEvent } from '@shared/types/models';

interface Props {
  event: CalendarEvent | null;
  onClose: () => void;
}

export function EventEditDialog({ event, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [picker, setPicker] = useState<'start' | 'end' | null>(null);
  const update = useUpdateCalendarEvent();

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description ?? '');
      setStartDate(parseISO(event.startDate));
      setEndDate(parseISO(event.endDate));
    }
  }, [event]);

  const submit = () => {
    if (!event || !event.calendarId) return;
    update.mutate(
      {
        calendarId: event.calendarId,
        eventId: event.id,
        patch: {
          title: title.trim(),
          description: description.trim() || undefined,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      },
      {
        onSuccess: () => {
          toast.success('Event updated');
          onClose();
        },
      }
    );
  };

  return (
    <Modal
      transparent
      visible={!!event}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-card p-5">
          <View className="mb-4 flex-row items-center gap-2">
            <Text className="flex-1 text-lg font-semibold text-foreground">
              Edit event
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Icon as={X} size={18} className="text-muted-foreground" />
            </Pressable>
          </View>

          <Text className="mb-1 text-2xs font-medium uppercase text-muted-foreground">
            Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            className="mb-3 rounded-lg bg-muted px-3 py-2 text-foreground"
            placeholderTextColor="hsl(210, 10%, 55%)"
          />

          <Text className="mb-1 text-2xs font-medium uppercase text-muted-foreground">
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            className="mb-3 min-h-[60px] rounded-lg bg-muted px-3 py-2 text-foreground"
            placeholderTextColor="hsl(210, 10%, 55%)"
          />

          <View className="mb-3 flex-row gap-2">
            <Pressable
              onPress={() => setPicker('start')}
              className="flex-1 flex-row items-center gap-2 rounded-lg border border-border px-3 py-2"
            >
              <Icon as={CalendarIcon} size={12} className="text-muted-foreground" />
              <Text className="text-xs text-foreground">
                Start: {format(startDate, 'MMM d, HH:mm')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPicker('end')}
              className="flex-1 flex-row items-center gap-2 rounded-lg border border-border px-3 py-2"
            >
              <Icon as={CalendarIcon} size={12} className="text-muted-foreground" />
              <Text className="text-xs text-foreground">
                End: {format(endDate, 'MMM d, HH:mm')}
              </Text>
            </Pressable>
          </View>

          {picker && (
            <DateTimePicker
              value={picker === 'start' ? startDate : endDate}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_e, d) => {
                if (Platform.OS === 'android') setPicker(null);
                if (!d) return;
                if (picker === 'start') setStartDate(d);
                else setEndDate(d);
              }}
            />
          )}

          <Pressable
            onPress={submit}
            disabled={!title.trim() || update.isPending}
            className="flex-row items-center justify-center gap-2 rounded-full bg-primary py-3"
          >
            <Icon as={Save} size={14} className="text-primary-foreground" />
            <Text className="text-sm font-semibold text-primary-foreground">
              {update.isPending ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
