import { Alert } from 'react-native';
import { router } from 'expo-router';
import { FormSheet } from '@/shared/components/ui/form-sheet';
import { useCreateNote } from '../hooks/useNotes';
import { NoteForm } from './NoteForm';
import type { NoteFormData } from '../types';

interface NoteFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategoryId?: string;
}

export function NoteFormSheet({
  isOpen,
  onClose,
  initialCategoryId,
}: NoteFormSheetProps) {
  const createNote = useCreateNote();

  const handleSubmit = async (data: NoteFormData) => {
    try {
      const newNote = await createNote.mutateAsync({
        title: data.title,
        content: data.content ?? '',
        categoryId: data.categoryId,
        tags: data.tags ?? [],
        isPinned: data.isPinned ?? false,
      });
      onClose();
      router.push(`/(app)/notes/${newNote.id}` as never);
    } catch {
      Alert.alert('Error', 'Could not create note. Please try again.');
    }
  };

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={onClose}
      title="New Note"
      snapPoints={['80%']}
    >
      <NoteForm
        defaultValues={
          initialCategoryId ? { categoryId: initialCategoryId } : undefined
        }
        onSubmit={handleSubmit}
        isLoading={createNote.isPending}
        submitLabel="Create Note"
      />
    </FormSheet>
  );
}
