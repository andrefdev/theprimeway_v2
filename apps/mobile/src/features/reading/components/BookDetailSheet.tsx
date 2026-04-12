import { View, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Button } from '@/shared/components/ui/button';
import {
  BookOpen,
  Star,
  Clock,
  CheckCircle2,
  Pause,
  XCircle,
  Trash2,
  ChevronDown,
  Minus,
  Plus,
} from 'lucide-react-native';
import { useUpdateBook, useDeleteBook } from '../hooks/useReading';
import { STATUS_OPTIONS } from '../model/constants';
import type { UserBook, BookStatus, BookPriority } from '../model/types';
import { useState, useCallback } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

interface BookDetailSheetProps {
  book: UserBook;
  onClose: () => void;
}

const PRIORITY_CONFIG: Record<BookPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-info/15 text-info' },
  medium: { label: 'Medium', color: 'bg-warning/15 text-warning' },
  high: { label: 'High', color: 'bg-destructive/15 text-destructive' },
};

export function BookDetailSheet({ book, onClose }: BookDetailSheetProps) {
  const updateBook = useUpdateBook();
  const deleteBook = useDeleteBook();
  const [currentPage, setCurrentPage] = useState(String(book.currentPage ?? ''));
  const [rating, setRating] = useState(book.rating ?? 0);
  const [notes, setNotes] = useState(book.notes ?? '');
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const authors = book.book.authors?.map((a) => a.name).join(', ') || 'Unknown';
  const totalPages = book.totalPagesSnapshot ?? book.book.pages ?? 0;

  const handleStatusChange = useCallback(
    (status: BookStatus) => {
      updateBook.mutate({ id: book.id, payload: { status } });
      setShowStatusPicker(false);
    },
    [book.id, updateBook]
  );

  const handlePriorityChange = useCallback(
    (priority: BookPriority) => {
      updateBook.mutate({ id: book.id, payload: { priority } });
    },
    [book.id, updateBook]
  );

  const handleToggleFavorite = useCallback(() => {
    updateBook.mutate({ id: book.id, payload: { favorite: !book.favorite } });
  }, [book.id, book.favorite, updateBook]);

  const handleSaveProgress = useCallback(() => {
    const page = parseInt(currentPage, 10);
    if (isNaN(page) || page < 0) return;
    updateBook.mutate({
      id: book.id,
      payload: {
        currentPage: page,
        totalPagesSnapshot: totalPages || undefined,
      },
    });
  }, [book.id, currentPage, totalPages, updateBook]);

  const handleSaveRating = useCallback(
    (r: number) => {
      setRating(r);
      updateBook.mutate({ id: book.id, payload: { rating: r } });
    },
    [book.id, updateBook]
  );

  const handleSaveNotes = useCallback(() => {
    updateBook.mutate({ id: book.id, payload: { notes: notes || null } });
  }, [book.id, notes, updateBook]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Book', `Remove "${book.book.title}" from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteBook.mutate(book.id);
          onClose();
        },
      },
    ]);
  }, [book.id, book.book.title, deleteBook, onClose]);

  return (
    <Animated.View entering={FadeIn.duration(200)} className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-24"
        showsVerticalScrollIndicator={false}
      >
        {/* Header with cover */}
        <View className="mt-4 flex-row gap-4">
          <View className="h-44 w-28 overflow-hidden rounded-xl bg-muted shadow-sm">
            {book.book.coverUrl ? (
              <Image
                source={{ uri: book.book.coverUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-primary/10">
                <Icon as={BookOpen} size={32} className="text-primary/40" />
              </View>
            )}
          </View>
          <View className="flex-1 gap-1.5">
            <Text className="text-lg font-bold text-foreground">{book.book.title}</Text>
            {book.book.subtitle && (
              <Text className="text-xs text-muted-foreground">{book.book.subtitle}</Text>
            )}
            <Text className="text-sm text-muted-foreground">{authors}</Text>
            {book.book.publishYear && (
              <Text className="text-xs text-muted-foreground">{book.book.publishYear}</Text>
            )}
            {totalPages > 0 && (
              <Text className="text-xs text-muted-foreground">{totalPages} pages</Text>
            )}

            {/* Favorite toggle */}
            <Pressable onPress={handleToggleFavorite} className="mt-1 flex-row items-center gap-1">
              <Icon
                as={Star}
                size={16}
                className={book.favorite ? 'text-yellow-400' : 'text-muted-foreground'}
                fill={book.favorite ? 'currentColor' : 'none'}
              />
              <Text className="text-xs text-muted-foreground">
                {book.favorite ? 'Favorited' : 'Add to favorites'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Status picker */}
        <View className="mt-5">
          <Text className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Status</Text>
          <Pressable
            onPress={() => setShowStatusPicker(!showStatusPicker)}
            className="flex-row items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
          >
            <Text className="text-sm font-medium capitalize text-foreground">
              {STATUS_OPTIONS.find((s) => s.value === book.status)?.label ?? book.status}
            </Text>
            <Icon as={ChevronDown} size={16} className="text-muted-foreground" />
          </Pressable>
          {showStatusPicker && (
            <View className="mt-1 gap-0.5 rounded-xl border border-border bg-card p-1">
              {STATUS_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => handleStatusChange(opt.value as BookStatus)}
                  className={`rounded-lg px-4 py-2.5 ${
                    book.status === opt.value ? 'bg-primary/10' : ''
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      book.status === opt.value
                        ? 'font-semibold text-primary'
                        : 'text-foreground'
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Priority */}
        <View className="mt-4">
          <Text className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Priority
          </Text>
          <View className="flex-row gap-2">
            {(['low', 'medium', 'high'] as BookPriority[]).map((p) => {
              const cfg = PRIORITY_CONFIG[p];
              const isActive = book.priority === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => handlePriorityChange(p)}
                  className={`rounded-full border px-4 py-1.5 ${
                    isActive ? 'border-primary bg-primary/10' : 'border-border bg-card'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {cfg.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Page progress (only for in_progress) */}
        {book.status === 'in_progress' && totalPages > 0 && (
          <View className="mt-4">
            <Text className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Progress
            </Text>
            <View className="rounded-xl border border-border bg-card p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <Pressable
                    onPress={() => {
                      const n = Math.max(0, (parseInt(currentPage, 10) || 0) - 1);
                      setCurrentPage(String(n));
                    }}
                    className="h-8 w-8 items-center justify-center rounded-full bg-muted"
                  >
                    <Icon as={Minus} size={14} className="text-foreground" />
                  </Pressable>
                  <TextInput
                    className="w-16 text-center text-lg font-bold text-foreground"
                    keyboardType="number-pad"
                    value={currentPage}
                    onChangeText={setCurrentPage}
                  />
                  <Pressable
                    onPress={() => {
                      const n = Math.min(totalPages, (parseInt(currentPage, 10) || 0) + 1);
                      setCurrentPage(String(n));
                    }}
                    className="h-8 w-8 items-center justify-center rounded-full bg-muted"
                  >
                    <Icon as={Plus} size={14} className="text-foreground" />
                  </Pressable>
                </View>
                <Text className="text-sm text-muted-foreground">/ {totalPages}</Text>
              </View>
              {/* Progress bar */}
              <View className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <View
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min(
                      ((parseInt(currentPage, 10) || 0) / totalPages) * 100,
                      100
                    )}%`,
                  }}
                />
              </View>
              <Pressable
                onPress={handleSaveProgress}
                className="mt-3 items-center rounded-lg bg-primary/10 py-2"
              >
                <Text className="text-xs font-medium text-primary">Save Progress</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Rating (for completed books) */}
        {(book.status === 'completed' || book.rating) && (
          <View className="mt-4">
            <Text className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Rating
            </Text>
            <View className="flex-row gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <Pressable key={r} onPress={() => handleSaveRating(r)}>
                  <Icon
                    as={Star}
                    size={28}
                    className={r <= rating ? 'text-yellow-400' : 'text-muted-foreground/30'}
                    fill={r <= rating ? 'currentColor' : 'none'}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        <View className="mt-4">
          <Text className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Notes</Text>
          <TextInput
            className="min-h-[80px] rounded-xl border border-border bg-card p-3 text-sm text-foreground"
            multiline
            textAlignVertical="top"
            placeholder="Add your notes about this book..."
            placeholderTextColor="hsl(220, 8%, 55%)"
            value={notes}
            onChangeText={setNotes}
            onBlur={handleSaveNotes}
          />
        </View>

        {/* Description */}
        {book.book.description && (
          <View className="mt-4">
            <Text className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Description
            </Text>
            <Text className="text-sm leading-5 text-muted-foreground" numberOfLines={8}>
              {book.book.description}
            </Text>
          </View>
        )}

        {/* Subjects/Tags */}
        {book.book.subjects && book.book.subjects.length > 0 && (
          <View className="mt-4">
            <Text className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Subjects
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {book.book.subjects.slice(0, 8).map((s) => (
                <View key={s} className="rounded-full bg-muted px-2.5 py-1">
                  <Text className="text-xs text-muted-foreground">{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Delete button */}
        <Pressable
          onPress={handleDelete}
          className="mb-4 mt-8 flex-row items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 py-3"
        >
          <Icon as={Trash2} size={16} className="text-destructive" />
          <Text className="text-sm font-medium text-destructive">Remove from Library</Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}
