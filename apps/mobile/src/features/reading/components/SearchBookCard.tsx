import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Button } from '@/shared/components/ui/button';
import { BookOpen, Plus } from 'lucide-react-native';
import { buildCoverUrl } from '../model/constants';
import type { OpenLibrarySearchResult } from '../model/types';

interface SearchBookCardProps {
  result: OpenLibrarySearchResult;
  onAdd: (result: OpenLibrarySearchResult) => void;
  isAdding?: boolean;
}

export function SearchBookCard({ result, onAdd, isAdding }: SearchBookCardProps) {
  const coverUri = result.coverI ? buildCoverUrl(result.coverI, 'M') : null;
  const authors = result.authorName?.join(', ') || 'Unknown';

  return (
    <View className="flex-row gap-3 rounded-xl border border-border bg-card p-3">
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
            {result.title}
          </Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {authors}
          </Text>
          {result.firstPublishYear && (
            <Text className="text-xs text-muted-foreground">
              {result.firstPublishYear} · {result.numberOfPagesMedian ?? '—'} pages
            </Text>
          )}
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={() => onAdd(result)}
            disabled={isAdding}
            className="flex-row items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5"
          >
            <Icon as={Plus} size={14} className="text-primary" />
            <Text className="text-xs font-medium text-primary">
              {isAdding ? 'Adding...' : 'Add to Library'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
