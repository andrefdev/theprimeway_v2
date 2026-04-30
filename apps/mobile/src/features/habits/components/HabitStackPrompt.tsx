import { View, Pressable, Modal } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Link2, X } from 'lucide-react-native';
import type { HabitWithLogs } from '../types';

interface Props {
  trigger: HabitWithLogs | null;
  stacked: HabitWithLogs | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function HabitStackPrompt({ trigger, stacked, onConfirm, onClose }: Props) {
  const visible = !!trigger && !!stacked;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full rounded-2xl bg-card p-5">
          <View className="mb-3 flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Icon as={Link2} size={16} className="text-primary" />
            </View>
            <Text className="flex-1 text-base font-semibold text-foreground">
              Stack reminder
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Icon as={X} size={16} className="text-muted-foreground" />
            </Pressable>
          </View>

          {trigger && stacked ? (
            <Text className="mb-4 text-sm text-muted-foreground">
              Nice on{' '}
              <Text className="font-semibold text-foreground">{trigger.name}</Text>
              ! Ready to chain into{' '}
              <Text className="font-semibold text-foreground">{stacked.name}</Text>
              ?
            </Text>
          ) : null}

          <View className="flex-row justify-end gap-2">
            <Pressable
              onPress={onClose}
              className="rounded-full border border-border px-4 py-2"
            >
              <Text className="text-sm font-medium text-foreground">Later</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onConfirm();
                onClose();
              }}
              className="rounded-full bg-primary px-4 py-2"
            >
              <Text className="text-sm font-semibold text-primary-foreground">
                Do it now
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
