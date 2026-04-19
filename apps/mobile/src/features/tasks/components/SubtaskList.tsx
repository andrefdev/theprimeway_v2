import { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Check, Plus, X, ListChecks } from 'lucide-react-native';
import { cn } from '@/shared/utils/cn';
import { loadSubtasks, saveSubtasks, type Subtask } from '../services/localSubtasks';

interface Props {
  taskId: string;
}

export function SubtaskList({ taskId }: Props) {
  const [items, setItems] = useState<Subtask[]>([]);
  const [draft, setDraft] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadSubtasks(taskId).then((loaded) => {
      setItems(loaded);
      setHydrated(true);
    });
  }, [taskId]);

  useEffect(() => {
    if (!hydrated) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      saveSubtasks(taskId, items).catch(() => {});
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [items, taskId, hydrated]);

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    setItems((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title, done: false },
    ]);
    setDraft('');
  };

  const toggle = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const doneCount = items.filter((i) => i.done).length;

  return (
    <View>
      <View className="mb-2 flex-row items-center gap-2">
        <Icon as={ListChecks} size={14} className="text-muted-foreground" />
        <Text className="text-xs font-medium text-muted-foreground">
          Subtasks {items.length > 0 ? `(${doneCount}/${items.length})` : ''}
        </Text>
      </View>

      {items.length > 0 && (
        <View className="mb-2 gap-1.5">
          {items.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
            >
              <Pressable
                onPress={() => toggle(item.id)}
                hitSlop={6}
                className={cn(
                  'h-5 w-5 items-center justify-center rounded border',
                  item.done ? 'border-primary bg-primary' : 'border-border bg-transparent'
                )}
              >
                {item.done && <Icon as={Check} size={12} className="text-primary-foreground" />}
              </Pressable>
              <Text
                className={cn(
                  'flex-1 text-sm',
                  item.done ? 'text-muted-foreground line-through' : 'text-foreground'
                )}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <Pressable onPress={() => remove(item.id)} hitSlop={6}>
                <Icon as={X} size={14} className="text-muted-foreground" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2">
        <Icon as={Plus} size={14} className="text-muted-foreground" />
        <TextInput
          className="flex-1 text-sm text-foreground"
          placeholder="Add subtask..."
          placeholderTextColor="hsl(210, 10%, 55%)"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        {draft.trim().length > 0 && (
          <Pressable onPress={add} hitSlop={6}>
            <Text className="text-xs font-semibold text-primary">Add</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
