import { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Send, Brain } from 'lucide-react-native';
import { useCreateBrainEntry } from '../hooks/useBrain';
import { toast } from '@/shared/lib/toast';
import { cn } from '@/shared/utils/cn';

export function BrainCaptureCard() {
  const [content, setContent] = useState('');
  const create = useCreateBrainEntry();

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    create.mutate(trimmed, {
      onSuccess: () => {
        setContent('');
        toast.success('Captured');
      },
    });
  };

  const disabled = !content.trim() || create.isPending;

  return (
    <View className="rounded-xl border border-border bg-card p-4">
      <View className="mb-3 flex-row items-center gap-2">
        <Icon as={Brain} size={16} className="text-primary" />
        <Text className="text-sm font-semibold text-foreground">Capture</Text>
      </View>
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="What's on your mind?"
        placeholderTextColor="hsl(210, 10%, 55%)"
        multiline
        textAlignVertical="top"
        className="min-h-[88px] rounded-lg bg-muted px-3 py-2 text-foreground"
      />
      <View className="mt-3 flex-row justify-end">
        <Pressable
          onPress={submit}
          disabled={disabled}
          className={cn(
            'flex-row items-center gap-2 rounded-full px-4 py-2',
            disabled ? 'bg-muted' : 'bg-primary'
          )}
        >
          <Icon
            as={Send}
            size={14}
            className={disabled ? 'text-muted-foreground' : 'text-primary-foreground'}
          />
          <Text
            className={cn(
              'text-xs font-semibold',
              disabled ? 'text-muted-foreground' : 'text-primary-foreground'
            )}
          >
            {create.isPending ? 'Saving…' : 'Capture'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
