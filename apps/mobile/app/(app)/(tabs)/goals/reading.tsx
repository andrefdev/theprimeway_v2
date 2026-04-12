import { View, ScrollView, TextInput, Alert, ActivityIndicator, Pressable, Modal } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { PillTabs } from '@/shared/components/ui/pill-tabs';
import { Header } from '@/shared/components/layout/Header';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { BookCard } from '@/features/reading/components/BookCard';
import { SearchBookCard } from '@/features/reading/components/SearchBookCard';
import { BookDetailSheet } from '@/features/reading/components/BookDetailSheet';
import { CreateGoalSheet } from '@/features/reading/components/CreateGoalSheet';
import {
  useUserBooks,
  useReadingStats,
  useAddBook,
  useUpdateBook,
  useDeleteBook,
  useDebouncedSearch,
  useReadingGoals,
  useDeleteReadingGoal,
} from '@/features/reading/hooks/useReading';
import { buildCoverUrl, getCurrentQuarter } from '@/features/reading/model/constants';
import {
  BookOpen,
  Search,
  Target,
  Plus,
  LayoutList,
  Trash2,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from '@/shared/hooks/useTranslation';
import type {
  BookStatus,
  BookPriority,
  OpenLibrarySearchResult,
  UserBook,
} from '@/features/reading/model/types';

type TabKey = 'library' | 'explore' | 'plan' | 'goals';

export default function ReadingScreen() {
  const { t } = useTranslation('features.reading');
  const TABS: Array<{ key: TabKey; label: string }> = [
    { key: 'library', label: t('tabs.library') },
    { key: 'explore', label: t('tabs.explore') },
    { key: 'plan', label: 'Plan' },
    { key: 'goals', label: t('tabs.goals') },
  ];
  const [activeTab, setActiveTab] = useState<TabKey>('library');
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title={t('title')} showBack />

      <View className="px-4 py-2">
        <PillTabs
          tabs={TABS}
          activeKey={activeTab}
          onTabPress={(key) => setActiveTab(key as TabKey)}
        />
      </View>

      {activeTab === 'library' && (
        <LibraryTab
          onSelectBook={setSelectedBook}
          t={t}
          onGoExplore={() => setActiveTab('explore')}
        />
      )}
      {activeTab === 'explore' && <ExploreTab t={t} />}
      {activeTab === 'plan' && <PlanTab onSelectBook={setSelectedBook} />}
      {activeTab === 'goals' && <GoalsTab t={t} />}

      {/* Book Detail Modal */}
      <Modal
        visible={!!selectedBook}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedBook(null)}
      >
        {selectedBook && (
          <SafeAreaView className="flex-1 bg-background">
            <View className="flex-row items-center justify-between px-4 py-3">
              <Text className="text-lg font-bold text-foreground">Book Details</Text>
              <Pressable
                onPress={() => setSelectedBook(null)}
                className="rounded-full bg-muted px-3 py-1.5"
              >
                <Text className="text-xs font-medium text-muted-foreground">Close</Text>
              </Pressable>
            </View>
            <BookDetailSheet book={selectedBook} onClose={() => setSelectedBook(null)} />
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

// ── Library Tab ───────────────────────────────
function LibraryTab({
  onSelectBook,
  t,
  onGoExplore,
}: {
  onSelectBook: (b: UserBook) => void;
  t: (k: string) => string;
  onGoExplore: () => void;
}) {
  const { data: stats } = useReadingStats();
  const [statusFilter, setStatusFilter] = useState<BookStatus | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<BookPriority | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const queryParams = useMemo(
    () => ({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(priorityFilter ? { priority: priorityFilter } : {}),
      ...(searchQuery.length >= 2 ? { search: searchQuery } : {}),
    }),
    [statusFilter, priorityFilter, searchQuery]
  );

  const { data: booksData, isLoading } = useUserBooks(
    Object.keys(queryParams).length > 0 ? queryParams : undefined
  );
  const books = booksData?.data ?? [];

  const STATUS_FILTERS: Array<{ key: BookStatus | undefined; label: string }> = [
    { key: undefined, label: 'All' },
    { key: 'to_read', label: 'To Read' },
    { key: 'in_progress', label: 'Reading' },
    { key: 'completed', label: 'Done' },
    { key: 'paused', label: 'Paused' },
  ];

  const PRIORITY_FILTERS: Array<{ key: BookPriority | undefined; label: string }> = [
    { key: undefined, label: 'All' },
    { key: 'high', label: 'High' },
    { key: 'medium', label: 'Medium' },
    { key: 'low', label: 'Low' },
  ];

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-20"
      showsVerticalScrollIndicator={false}
    >
      {/* Stats */}
      <Animated.View entering={FadeInDown.duration(300)} className="flex-row gap-3">
        <StatBadge emoji="📚" value={String(stats?.toRead ?? 0)} label={t('stats.toRead')} />
        <StatBadge emoji="📖" value={String(stats?.inProgress ?? 0)} label={t('stats.reading')} />
        <StatBadge emoji="✅" value={String(stats?.completed ?? 0)} label={t('stats.done')} />
        <StatBadge emoji="⭐" value={String(stats?.favorites ?? 0)} label={t('stats.favorites')} />
      </Animated.View>

      {/* Search */}
      <View className="mt-3 flex-row items-center rounded-xl border border-border bg-card px-3">
        <Icon as={Search} size={14} className="text-muted-foreground" />
        <TextInput
          className="ml-2 h-9 flex-1 text-sm text-foreground"
          placeholder="Search your library..."
          placeholderTextColor="hsl(220, 8%, 55%)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3"
        contentContainerClassName="gap-2"
      >
        {STATUS_FILTERS.map((f) => (
          <Pressable
            key={f.label}
            onPress={() => setStatusFilter(f.key)}
            className={`rounded-full border px-3 py-1.5 ${
              statusFilter === f.key
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                statusFilter === f.key ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Priority filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-2"
        contentContainerClassName="gap-2"
      >
        <Text className="self-center text-2xs text-muted-foreground">Priority:</Text>
        {PRIORITY_FILTERS.map((f) => (
          <Pressable
            key={f.label}
            onPress={() => setPriorityFilter(f.key)}
            className={`rounded-full border px-2.5 py-1 ${
              priorityFilter === f.key
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card'
            }`}
          >
            <Text
              className={`text-2xs font-medium ${
                priorityFilter === f.key ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Book list */}
      {isLoading ? (
        <ActivityIndicator className="mt-12" />
      ) : books.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(100).duration(300)} className="mt-8">
          <EmptyState
            icon={BookOpen}
            title={t('emptyLibrary')}
            description={t('emptyLibraryDescription')}
            actionLabel={t('searchBooks')}
            onAction={onGoExplore}
          />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.delay(100).duration(300)} className="mt-4 gap-3">
          {books.map((book) => (
            <BookCard key={book.id} book={book} onPress={() => onSelectBook(book)} />
          ))}
        </Animated.View>
      )}
    </ScrollView>
  );
}

// ── Explore Tab ───────────────────────────────
function ExploreTab({ t }: { t: (k: string) => string }) {
  const { query, setQuery, data, isLoading } = useDebouncedSearch();
  const addBook = useAddBook();
  const [addingKey, setAddingKey] = useState<string | null>(null);

  const handleAdd = useCallback(
    async (result: OpenLibrarySearchResult) => {
      setAddingKey(result.key);
      try {
        await addBook.mutateAsync({
          workKey: result.key,
          status: 'to_read',
          title: result.title,
          authors: (result.authorName ?? []).map((name, i) => ({
            name,
            key: result.authorKey?.[i] ?? '',
          })),
          coverUrl: result.coverI ? buildCoverUrl(result.coverI, 'L') : undefined,
          pages: result.numberOfPagesMedian,
          publishYear: result.firstPublishYear,
          subjects: result.subject?.slice(0, 5),
        });
        Alert.alert('Added!', `"${result.title}" has been added to your library.`);
      } catch (error: any) {
        if (error?.response?.status === 409) {
          Alert.alert('Already in library', 'This book is already in your library.');
        } else {
          Alert.alert('Error', 'Could not add book. Try again.');
        }
      } finally {
        setAddingKey(null);
      }
    },
    [addBook]
  );

  const results = data?.docs ?? [];

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-20"
      showsVerticalScrollIndicator={false}
    >
      {/* Search */}
      <View className="mb-3 flex-row items-center rounded-xl border border-border bg-card px-3">
        <Icon as={Search} size={16} className="text-muted-foreground" />
        <TextInput
          className="ml-2 h-10 flex-1 text-sm text-foreground"
          placeholder={t('searchPlaceholder')}
          placeholderTextColor="hsl(220, 8%, 55%)"
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>

      {isLoading && <ActivityIndicator className="mt-8" />}

      {!isLoading && query.length < 2 && (
        <Animated.View entering={FadeInDown.duration(300)} className="mt-4">
          <Text className="mb-3 text-sm font-semibold text-foreground">Recommended Books</Text>
          <Text className="text-xs text-muted-foreground">
            Search for any book to add it to your library.
          </Text>
        </Animated.View>
      )}

      {!isLoading && results.length > 0 && (
        <Animated.View entering={FadeInDown.duration(300)} className="gap-3">
          <Text className="text-xs text-muted-foreground">
            {data?.numFound ?? 0} results found
          </Text>
          {results.map((result) => (
            <SearchBookCard
              key={result.key}
              result={result}
              onAdd={handleAdd}
              isAdding={addingKey === result.key}
            />
          ))}
        </Animated.View>
      )}

      {!isLoading && query.length >= 2 && results.length === 0 && (
        <EmptyState
          icon={Search}
          title="No results"
          description={`No books found for "${query}". Try a different search.`}
        />
      )}
    </ScrollView>
  );
}

// ── Plan Tab ─────────────────────────────────
function PlanTab({ onSelectBook }: { onSelectBook: (b: UserBook) => void }) {
  const { data: allBooks, isLoading } = useUserBooks();
  const books = allBooks?.data ?? [];
  const currentQ = getCurrentQuarter();

  const sections = useMemo(() => {
    const inProgress = books.filter((b) => b.status === 'in_progress');
    const thisQuarter = books.filter(
      (b) =>
        b.status === 'to_read' && b.plannedQuarter === currentQ
    );
    const upcoming = books.filter(
      (b) =>
        b.status === 'to_read' && (!b.plannedQuarter || b.plannedQuarter !== currentQ)
    );
    const completed = books
      .filter((b) => b.status === 'completed')
      .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))
      .slice(0, 5);

    return [
      { title: 'Currently Reading', emoji: '📖', books: inProgress },
      { title: `This Quarter (${currentQ})`, emoji: '📅', books: thisQuarter },
      { title: 'Up Next', emoji: '📚', books: upcoming },
      { title: 'Recently Completed', emoji: '✅', books: completed },
    ];
  }, [books, currentQ]);

  if (isLoading) {
    return <ActivityIndicator className="mt-12" />;
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-20"
      showsVerticalScrollIndicator={false}
    >
      {sections.map((section) => (
        <Animated.View
          key={section.title}
          entering={FadeInDown.duration(300)}
          className="mt-4"
        >
          <View className="mb-2 flex-row items-center gap-2">
            <Text className="text-sm">{section.emoji}</Text>
            <Text className="text-sm font-semibold text-foreground">{section.title}</Text>
            <View className="rounded-full bg-muted px-2 py-0.5">
              <Text className="text-2xs font-medium text-muted-foreground">
                {section.books.length}
              </Text>
            </View>
          </View>

          {section.books.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border/50 py-6">
              <Text className="text-center text-xs text-muted-foreground">No books</Text>
            </View>
          ) : (
            <View className="gap-2">
              {section.books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onPress={() => onSelectBook(book)}
                />
              ))}
            </View>
          )}
        </Animated.View>
      ))}

      {books.length === 0 && (
        <EmptyState
          icon={LayoutList}
          title="No reading plan yet"
          description="Add books to your library to build your reading plan."
        />
      )}
    </ScrollView>
  );
}

// ── Goals Tab ─────────────────────────────────
function GoalsTab({ t }: { t: (k: string) => string }) {
  const { data: goals, isLoading } = useReadingGoals();
  const { data: stats } = useReadingStats();
  const deleteGoal = useDeleteReadingGoal();
  const [showCreateGoal, setShowCreateGoal] = useState(false);

  const handleDeleteGoal = useCallback(
    (goalId: string) => {
      Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteGoal.mutate(goalId),
        },
      ]);
    },
    [deleteGoal]
  );

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-20"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(300)} className="gap-4">
        {/* Year progress */}
        <View className="rounded-xl border border-border bg-card p-4">
          <View className="flex-row items-center gap-2">
            <Icon as={Target} size={18} className="text-primary" />
            <Text className="text-sm font-semibold text-foreground">
              {new Date().getFullYear()} Reading
            </Text>
          </View>
          <Text className="mt-2 text-2xl font-bold text-foreground">
            {stats?.completedThisYear ?? 0} books
          </Text>
          <Text className="text-xs text-muted-foreground">completed this year</Text>
        </View>

        {/* Add goal button */}
        <Pressable
          onPress={() => setShowCreateGoal(true)}
          className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 py-3"
        >
          <Icon as={Plus} size={16} className="text-primary" />
          <Text className="text-sm font-medium text-primary">Add Reading Goal</Text>
        </Pressable>

        {isLoading ? (
          <ActivityIndicator className="mt-4" />
        ) : !goals || goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No reading goals"
            description="Set a reading goal to track your progress."
          />
        ) : (
          goals.map((goal) => {
            const completed = stats?.completedThisYear ?? 0;
            const progress = Math.min((completed / goal.targetBooks) * 100, 100);

            return (
              <View key={goal.id} className="rounded-xl border border-border bg-card p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold capitalize text-foreground">
                    {goal.periodType} Goal
                  </Text>
                  <Pressable onPress={() => handleDeleteGoal(goal.id)}>
                    <Icon as={Trash2} size={14} className="text-muted-foreground" />
                  </Pressable>
                </View>
                <Text className="mt-1 text-lg font-bold text-foreground">
                  {completed} / {goal.targetBooks} books
                </Text>
                {/* Progress bar */}
                <View className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <View
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progress}%` }}
                  />
                </View>
                <View className="mt-1.5 flex-row items-center justify-between">
                  <Text className="text-xs text-muted-foreground">
                    {new Date(goal.startDate).toLocaleDateString()} —{' '}
                    {new Date(goal.endDate).toLocaleDateString()}
                  </Text>
                  <Text className="text-xs font-medium text-primary">
                    {Math.round(progress)}%
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </Animated.View>

      {/* Create Goal Modal */}
      <Modal
        visible={showCreateGoal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowCreateGoal(false)}
      >
        <SafeAreaView className="flex-1 justify-end bg-black/40">
          <CreateGoalSheet onClose={() => setShowCreateGoal(false)} />
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

// ── Stat Badge ────────────────────────────────
function StatBadge({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View className="flex-1 items-center rounded-xl border border-border bg-card py-2.5">
      <Text className="text-sm">{emoji}</Text>
      <Text className="text-sm font-bold text-foreground">{value}</Text>
      <Text className="text-2xs text-muted-foreground">{label}</Text>
    </View>
  );
}
