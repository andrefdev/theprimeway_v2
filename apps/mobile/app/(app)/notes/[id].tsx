import { View, TextInput, ScrollView, Pressable } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { useNote, useUpdateNote, useCreateNote } from '@features/notes/hooks/useNotes';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef, useCallback } from 'react';
import Markdown from 'react-native-markdown-display';
import { useColorScheme } from 'nativewind';
import { useTranslation } from '@/shared/hooks/useTranslation';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { colorScheme } = useColorScheme();
  const { t } = useTranslation('features.notes');

  const { data: note, isLoading } = useNote(isNew ? '' : id);
  const updateNote = useUpdateNote();
  const createNote = useCreateNote();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteId, setNoteId] = useState<string | null>(isNew ? null : id);
  const [isEditing, setIsEditing] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const contentRef = useRef<TextInput>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
    }
  }, [note]);

  const autoSave = useCallback(async (titleVal: string, contentVal: string) => {
    if (!titleVal.trim()) return;
    try {
      if (noteId) {
        await updateNote.mutateAsync({ id: noteId, data: { title: titleVal, content: contentVal } });
      } else {
        const created = await createNote.mutateAsync({ title: titleVal, content: contentVal });
        if (created?.id) setNoteId(created.id);
      }
    } catch {
      // silent
    }
  }, [noteId, updateNote, createNote]);

  const scheduleSave = useCallback((titleVal: string, contentVal: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => autoSave(titleVal, contentVal), 1500);
  }, [autoSave]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    scheduleSave(val, content);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    scheduleSave(title, val);
  };

  const handleBack = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (title.trim()) autoSave(title, content);
    router.back();
  };

  if (!isNew && isLoading) return <LoadingOverlay />;

  const isDark = colorScheme === 'dark';

  const mdStyles = {
    body: { color: isDark ? '#FAFAFA' : '#1a1a2e', fontSize: 15, lineHeight: 24 },
    heading1: { color: isDark ? '#FAFAFA' : '#1a1a2e', fontSize: 26, fontWeight: '800' as const, marginTop: 20, marginBottom: 8 },
    heading2: { color: isDark ? '#FAFAFA' : '#1a1a2e', fontSize: 22, fontWeight: '700' as const, marginTop: 16, marginBottom: 6 },
    heading3: { color: isDark ? '#FAFAFA' : '#1a1a2e', fontSize: 18, fontWeight: '600' as const, marginTop: 12, marginBottom: 4 },
    paragraph: { marginTop: 0, marginBottom: 8 },
    listItem: { marginBottom: 4 },
    listUnorderedItemIcon: { color: isDark ? '#6454FD' : '#280FFB', fontSize: 8, lineHeight: 24 },
    code_inline: { backgroundColor: isDark ? '#1E2530' : '#f0f0f0', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, fontSize: 13, fontFamily: 'monospace' },
    fence: { backgroundColor: isDark ? '#1E2530' : '#f0f0f0', padding: 12, borderRadius: 8, marginVertical: 8 },
    blockquote: { borderLeftWidth: 3, borderLeftColor: '#280FFB', paddingLeft: 12, marginVertical: 8, opacity: 0.85 },
    link: { color: '#280FFB', textDecorationLine: 'underline' as const },
    strong: { fontWeight: '700' as const },
    em: { fontStyle: 'italic' as const },
    hr: { backgroundColor: isDark ? '#262E38' : '#e5e5e5', height: 1, marginVertical: 16 },
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header — minimal */}
      <View className="flex-row items-center border-b border-border px-4 py-3">
        <Pressable onPress={handleBack} className="flex-row items-center gap-1" hitSlop={8}>
          <Icon as={ChevronLeft} size={22} className="text-foreground" />
        </Pressable>
        <View className="flex-1" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 pb-40"
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <TextInput
          className="mb-4 text-2xl font-bold text-foreground"
          placeholder={t('editor.titlePlaceholder')}
          placeholderTextColor="hsl(210, 10%, 55%)"
          value={title}
          onChangeText={handleTitleChange}
          autoFocus={isNew}
        />

        {/* Content — tap to toggle between edit and rendered markdown */}
        {isEditing ? (
          <TextInput
            ref={contentRef}
            className="min-h-[400px] text-[15px] leading-6 text-foreground"
            placeholder={t('editor.contentPlaceholder')}
            placeholderTextColor="hsl(210, 10%, 55%)"
            value={content}
            onChangeText={handleContentChange}
            multiline
            textAlignVertical="top"
            autoFocus={!isNew || false}
            onBlur={() => {
              if (content.trim()) setIsEditing(false);
            }}
          />
        ) : (
          <Pressable onPress={() => {
            setIsEditing(true);
            setTimeout(() => contentRef.current?.focus(), 100);
          }}>
            {content.trim() ? (
              <Markdown style={mdStyles}>{content}</Markdown>
            ) : (
              <Text className="min-h-[200px] text-sm text-muted-foreground">
                {t('editor.tapToWrite')}
              </Text>
            )}
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
