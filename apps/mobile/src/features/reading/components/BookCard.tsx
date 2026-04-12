import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { cn } from '@/shared/utils/cn';
import { Star, BookOpen, Clock, CheckCircle2, Pause, XCircle } from 'lucide-react-native';
import type { UserBook, BookStatus } from '../model/types';

const STATUS_CONFIG: Record<BookStatus, { icon: typeof BookOpen; color: string; label: string }> = {
  to_read: { icon: Clock, color: 'text-muted-foreground', label: 'To Read' },
  in_progress: { icon: BookOpen, color: 'text-primary', label: 'Reading' },
  completed: { icon: CheckCircle2, color: 'text-green-500', label: 'Done' },
  paused: { icon: Pause, color: 'text-yellow-500', label: 'Paused' },
  abandoned: { icon: XCircle, color: 'text-red-400', label: 'Dropped' },
};

interface BookCardProps {
  book: UserBook;
  onPress?: () => void;
  compact?: boolean;
}

export function BookCard({ book, onPress, compact }: BookCardProps) {
  const { icon: StatusIcon, color, label } = STATUS_CONFIG[book.status];
  const authors = book.book.authors?.map((a) => a.name).join(', ') || 'Unknown';
  const coverUri = book.book.coverUrl;

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        className="w-28 items-center gap-2"
      >
        <View className="h-40 w-28 overflow-hidden rounded-lg bg-muted">
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <View className="flex-1 items-center justify-center bg-primary/10">
              <Icon as={BookOpen} size={28} className="text-primary/40" />
            </View>
          )}
        </View>
        <Text className="text-xs font-medium text-foreground" numberOfLines={2}>
          {book.book.title}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className="flex-row gap-3 rounded-xl border border-border bg-card p-3"
    >
      {/* Cover */}
      <View className="h-24 w-16 overflow-hidden rounded-lg bg-muted">
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <View className="flex-1 items-center justify-center bg-primary/10">
            <Icon as={BookOpen} size={20} className="text-primary/40" />
          </View>
        )}
      </View>

      {/* Info */}
      <View className="flex-1 justify-between">
        <View className="gap-0.5">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>
            {book.book.title}
          </Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {authors}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1">
            <Icon as={StatusIcon} size={12} className={color} />
            <Text className={cn('text-xs font-medium', color)}>{label}</Text>
          </View>

          {book.status === 'in_progress' && book.progressPercent > 0 && (
            <Text className="text-xs text-muted-foreground">{book.progressPercent}%</Text>
          )}

          {book.favorite && (
            <Icon as={Star} size={12} className="text-yellow-400" fill="currentColor" />
          )}

          {book.rating != null && book.rating > 0 && (
            <View className="flex-row items-center gap-0.5">
              <Icon as={Star} size={10} className="text-yellow-400" fill="currentColor" />
              <Text className="text-xs text-muted-foreground">{book.rating}</Text>
            </View>
          )}
        </View>

        {/* Progress bar for in_progress */}
        {book.status === 'in_progress' && (
          <View className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(book.progressPercent, 100)}%` }}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}
