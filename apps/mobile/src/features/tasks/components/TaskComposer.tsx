import { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Plus, Calendar, Clock } from 'lucide-react-native';
import { format, addDays } from 'date-fns';
import { cn } from '@/shared/utils/cn';
import { useCreateTask } from '../hooks/useTasks';
import { toast } from '@/shared/lib/toast';

const BUCKETS = [
  { key: 'today', label: 'Today', offset: 0 },
  { key: 'tomorrow', label: 'Tomorrow', offset: 1 },
  { key: 'week', label: 'This week', offset: 6 },
] as const;

const DURATIONS = [15, 30, 60];

interface Props {
  defaultBucket?: 'today' | 'tomorrow' | 'week';
  onCreated?: () => void;
  placeholder?: string;
}

export function TaskComposer({
  defaultBucket = 'today',
  onCreated,
  placeholder = 'Add a task…',
}: Props) {
  const [title, setTitle] = useState('');
  const [bucket, setBucket] = useState<typeof BUCKETS[number]['key']>(defaultBucket);
  const [duration, setDuration] = useState(30);
  const create = useCreateTask();

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const offset = BUCKETS.find((b) => b.key === bucket)?.offset ?? 0;
    const scheduledDate = format(addDays(new Date(), offset), 'yyyy-MM-dd');
    create.mutate(
      {
        title: trimmed,
        priority: 'medium',
        scheduledDate,
        estimatedDurationMinutes: duration,
        tags: [],
        isAllDay: false,
      } as any,
      {
        onSuccess: () => {
          setTitle('');
          toast.success('Task created');
          onCreated?.();
        },
      }
    );
  };

  const canSubmit = !!title.trim() && !create.isPending;

  return (
    <View className="rounded-xl border border-border bg-card p-3">
      <View className="flex-row items-center gap-2">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={placeholder}
          placeholderTextColor="hsl(210, 10%, 55%)"
          className="flex-1 text-sm text-foreground"
          onSubmitEditing={submit}
        />
        <Pressable
          onPress={submit}
          disabled={!canSubmit}
          className={cn(
            'h-8 w-8 items-center justify-center rounded-full',
            canSubmit ? 'bg-primary' : 'bg-muted'
          )}
        >
          <Icon
            as={Plus}
            size={14}
            className={canSubmit ? 'text-primary-foreground' : 'text-muted-foreground'}
          />
        </Pressable>
      </View>

      <View className="mt-3 flex-row flex-wrap gap-1.5">
        {BUCKETS.map((b) => (
          <Pressable
            key={b.key}
            onPress={() => setBucket(b.key)}
            className={cn(
              'flex-row items-center gap-1 rounded-full px-2.5 py-1',
              bucket === b.key ? 'bg-primary/15' : 'bg-muted'
            )}
          >
            <Icon
              as={Calendar}
              size={10}
              className={bucket === b.key ? 'text-primary' : 'text-muted-foreground'}
            />
            <Text
              className={cn(
                'text-2xs font-medium',
                bucket === b.key ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {b.label}
            </Text>
          </Pressable>
        ))}
        {DURATIONS.map((d) => (
          <Pressable
            key={d}
            onPress={() => setDuration(d)}
            className={cn(
              'flex-row items-center gap-1 rounded-full px-2.5 py-1',
              duration === d ? 'bg-primary/15' : 'bg-muted'
            )}
          >
            <Icon
              as={Clock}
              size={10}
              className={duration === d ? 'text-primary' : 'text-muted-foreground'}
            />
            <Text
              className={cn(
                'text-2xs font-medium',
                duration === d ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {d}m
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
