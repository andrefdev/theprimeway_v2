import { View, Pressable, TextInput, ScrollView } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { useNotes, useNoteCategories } from '@features/notes/hooks/useNotes';
import { ChipFilter } from '@/shared/components/ui/chip-filter';
import { router } from 'expo-router';
import { Plus, FileText, Search, Pin, AlertTriangle, Archive, ArchiveX } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { PageHeader } from '@features/personalization/components/PageHeader';
import { NoteCard } from '@features/notes/components/NoteCard';
import { NoteFormSheet } from '@features/notes/components/NoteFormSheet';
import { FAB } from '@/shared/components/ui/fab';

export default function NotesScreen() {
  const { t } = useTranslation('features.notes');

  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  const {
    data: notes,
    isLoading,
    isError,
    refetch,
  } = useNotes({
    search: search || undefined,
    categoryId: selectedCategoryId !== 'all' ? selectedCategoryId : undefined,
    isArchived: showArchived,
  });

  const { data: categories } = useNoteCategories();

  // Count notes per category (from full notes list for badge display)
  const { data: allNotes } = useNotes({ isArchived: showArchived });

  const categoryNoteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (allNotes ?? []).forEach((n) => {
      if (n.categoryId) {
        counts[n.categoryId] = (counts[n.categoryId] ?? 0) + 1;
      }
    });
    return counts;
  }, [allNotes]);

  // Build category pill tabs
  const categoryChips = useMemo(() => {
    const allCount = (allNotes ?? []).length;
    const chips = [{ key: 'all', label: `All (${allCount})` }];
    (categories ?? []).forEach((cat) => {
      const count = categoryNoteCounts[cat.id] ?? 0;
      chips.push({ key: cat.id, label: `${cat.name} (${count})` });
    });
    return chips;
  }, [categories, categoryNoteCounts, allNotes]);

  // Extract unique tags from current notes list
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    (allNotes ?? []).forEach((n) => {
      (n.tags ?? []).forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [allNotes]);

  const tagChips = useMemo(() => {
    return [
      { key: 'all', label: 'All tags' },
      ...allTags.map((tag) => ({ key: tag, label: `#${tag}` })),
    ];
  }, [allTags]);

  // Client-side tag filter on top of server-filtered notes
  const displayedNotes = useMemo(() => {
    if (!notes) return [];
    if (selectedTag === 'all') return notes;
    return notes.filter((n) => (n.tags ?? []).includes(selectedTag));
  }, [notes, selectedTag]);

  const pinnedNotes = displayedNotes.filter((n) => n.isPinned);
  const otherNotes = displayedNotes.filter((n) => !n.isPinned);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <PageHeader
        sectionId="notes"
        title={t('title')}
        actions={
          <View className="flex-row items-center gap-2">
            {/* Archive toggle */}
            <Pressable
              onPress={() => {
                setShowArchived((prev) => !prev);
                setSelectedCategoryId('all');
                setSelectedTag('all');
              }}
              className={cn(
                'h-9 w-9 items-center justify-center rounded-full border active:bg-muted',
                showArchived ? 'border-primary bg-primary/10' : 'border-border bg-card'
              )}
              hitSlop={8}
            >
              <Icon
                as={showArchived ? ArchiveX : Archive}
                size={16}
                className={showArchived ? 'text-primary' : 'text-muted-foreground'}
              />
            </Pressable>

            {/* New note button */}
            <Pressable
              onPress={() => router.push('/(app)/notes/new' as never)}
              className="h-9 w-9 items-center justify-center rounded-full bg-primary active:bg-primary-hover"
              hitSlop={8}
            >
              <Icon as={Plus} size={18} className="text-primary-foreground" />
            </Pressable>
          </View>
        }
      />

      {/* Search Bar */}
      <View className="mx-4 mb-2 mt-2 flex-row items-center rounded-xl border border-border bg-card px-3">
        <Icon as={Search} size={16} className="text-muted-foreground" />
        <TextInput
          className="ml-2 h-10 flex-1 text-sm text-foreground"
          placeholder={t('search')}
          placeholderTextColor="hsl(210, 10%, 55%)"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category filter tabs */}
      {categoryChips.length > 1 && (
        <View className="mb-1.5 mt-1">
          <ChipFilter
            chips={categoryChips}
            activeKey={selectedCategoryId}
            onChipPress={(key) => {
              setSelectedCategoryId(key);
              setSelectedTag('all');
            }}
            className="px-4"
          />
        </View>
      )}

      {/* Tag filter */}
      {allTags.length > 0 && (
        <View className="mb-2">
          <ChipFilter
            chips={tagChips}
            activeKey={selectedTag}
            onChipPress={setSelectedTag}
            className="px-4"
          />
        </View>
      )}

      {isLoading ? (
        <LoadingOverlay />
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title={t('errorLoadingTitle')}
          description={t('errorLoadingDescription')}
          actionLabel={t('actions.back')}
          onAction={() => refetch()}
        />
      ) : !displayedNotes.length ? (
        <EmptyState
          icon={showArchived ? Archive : FileText}
          title={showArchived ? 'No archived notes' : t('noNotes')}
          description={showArchived ? 'Archived notes will appear here.' : t('noNotesDescription')}
          actionLabel={showArchived ? undefined : t('newNote')}
          onAction={showArchived ? undefined : () => router.push('/(app)/notes/new' as never)}
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-20 pt-2"
          showsVerticalScrollIndicator={false}
        >
          {/* Pinned section */}
          {pinnedNotes.length > 0 && (
            <View className="mb-4">
              <View className="mb-2 flex-row items-center gap-1.5 px-4">
                <Icon as={Pin} size={12} className="text-primary" />
                <Text className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Pinned
                </Text>
              </View>
              <View className="flex-row flex-wrap px-2">
                {pinnedNotes.map((note, index) => (
                  <NoteCard key={note.id} note={note} index={index} />
                ))}
              </View>
            </View>
          )}

          {/* Other notes */}
          {otherNotes.length > 0 && (
            <View>
              {pinnedNotes.length > 0 && (
                <View className="mb-2 px-4">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Notes
                  </Text>
                </View>
              )}
              <View className="flex-row flex-wrap px-2">
                {otherNotes.map((note, index) => (
                  <NoteCard key={note.id} note={note} index={pinnedNotes.length + index} />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <FAB icon={Plus} onPress={() => setShowCreateSheet(true)} />
      <NoteFormSheet
        isOpen={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        initialCategoryId={selectedCategoryId !== 'all' ? selectedCategoryId : undefined}
      />
    </SafeAreaView>
  );
}
