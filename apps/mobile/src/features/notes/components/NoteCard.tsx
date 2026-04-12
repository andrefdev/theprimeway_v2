import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Pin } from 'lucide-react-native';
import type { Note } from '@shared/types/models';
import { cn } from '@/shared/utils/cn';
import Animated, { FadeIn } from 'react-native-reanimated';

interface NoteCardProps {
  note: Note;
  index?: number;
}

function formatNoteDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const noteDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (noteDay.getTime() === todayStart.getTime()) return 'Today';
  if (noteDay.getTime() === yesterdayStart.getTime()) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NoteCard({ note, index = 0 }: NoteCardProps) {
  const contentPreview = note.content
    ? note.content.replace(/<[^>]*>/g, '').trim()
    : '';

  const categoryColor = note.category?.color ?? '#6B7280';

  return (
    <Animated.View
      entering={FadeIn.delay(index * 30).duration(250)}
      className="w-1/2 p-1.5"
    >
      <Pressable
        className={cn(
          'rounded-xl border bg-card p-3 active:bg-muted',
          note.isPinned ? 'border-primary/30' : 'border-border'
        )}
        onPress={() => router.push(`/(app)/notes/${note.id}` as never)}
      >
        {/* Top row: category dot + name | pin icon */}
        <View className="mb-1.5 flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center gap-1.5">
            <View
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
            {note.category ? (
              <Text className="text-2xs text-muted-foreground" numberOfLines={1}>
                {note.category.name}
              </Text>
            ) : null}
          </View>
          {note.isPinned && (
            <Icon as={Pin} size={11} className="text-primary" />
          )}
        </View>

        {/* Title */}
        <Text
          className="text-sm font-bold text-foreground"
          numberOfLines={2}
        >
          {note.title}
        </Text>

        {/* Content preview */}
        {contentPreview ? (
          <Text
            className="mt-1 text-xs leading-4 text-muted-foreground"
            numberOfLines={3}
          >
            {contentPreview}
          </Text>
        ) : null}

        {/* Tags row (up to 3) + date */}
        <View className="mt-2 flex-row items-center justify-between">
          <View className="flex-1 flex-row flex-wrap gap-1 pr-1">
            {(note.tags ?? []).slice(0, 3).map((tag) => (
              <View key={tag} className="rounded-full bg-muted px-1.5 py-0.5">
                <Text className="text-2xs text-muted-foreground">#{tag}</Text>
              </View>
            ))}
          </View>
          <Text className="shrink-0 text-2xs text-muted-foreground">
            {formatNoteDate(note.updatedAt)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
