import { Modal, View, Pressable } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { X, Clock, Edit2, Trash2 } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import type { CalendarEvent } from '@shared/types/models';

interface Props {
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}

export function EventQuickView({ event, onClose, onEdit, onDelete }: Props) {
  return (
    <Modal
      transparent
      visible={!!event}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full rounded-2xl bg-card p-5">
          <View className="mb-3 flex-row items-center gap-2">
            <View
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: event?.color ?? '#6366f1' }}
            />
            <Text className="flex-1 text-base font-semibold text-foreground" numberOfLines={2}>
              {event?.title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Icon as={X} size={16} className="text-muted-foreground" />
            </Pressable>
          </View>

          {event ? (
            <View className="mb-4 flex-row items-center gap-2">
              <Icon as={Clock} size={12} className="text-muted-foreground" />
              <Text className="text-xs text-muted-foreground">
                {event.isAllDay
                  ? `${format(parseISO(event.startDate), 'PPP')} · All day`
                  : `${format(parseISO(event.startDate), 'PPP HH:mm')} – ${format(parseISO(event.endDate), 'HH:mm')}`}
              </Text>
            </View>
          ) : null}

          {event?.description ? (
            <Text className="mb-4 text-sm text-foreground">{event.description}</Text>
          ) : null}

          <View className="flex-row justify-end gap-2">
            <Pressable
              onPress={() => event && onDelete(event)}
              className="flex-row items-center gap-1.5 rounded-full border border-destructive px-3 py-2"
            >
              <Icon as={Trash2} size={12} className="text-destructive" />
              <Text className="text-xs font-semibold text-destructive">Delete</Text>
            </Pressable>
            <Pressable
              onPress={() => event && onEdit(event)}
              className="flex-row items-center gap-1.5 rounded-full bg-primary px-3 py-2"
            >
              <Icon as={Edit2} size={12} className="text-primary-foreground" />
              <Text className="text-xs font-semibold text-primary-foreground">
                Edit
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
