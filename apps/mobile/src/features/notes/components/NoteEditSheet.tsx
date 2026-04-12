import { Alert } from 'react-native';
import { FormSheet } from '@/shared/components/ui/form-sheet';
import { useUpdateNote } from '../hooks/useNotes';
import { NoteForm } from './NoteForm';
import type { NoteFormData } from '../types';
import type { Note } from '@shared/types/models';

interface NoteEditSheetProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
}

export function NoteEditSheet({ note, isOpen, onClose }: NoteEditSheetProps) {
  const updateNote = useUpdateNote();

  const handleSubmit = async (data: NoteFormData) => {
    if (!note) return;
    try {
      await updateNote.mutateAsync({
        id: note.id,
        data: {
          title: data.title,
          content: data.content ?? '',
          categoryId: data.categoryId,
          tags: data.tags ?? [],
          isPinned: data.isPinned ?? false,
        },
      });
      onClose();
    } catch {
      Alert.alert('Error', 'Could not update note. Please try again.');
    }
  };

  if (!note) return null;

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Note"
      snapPoints={['80%']}
    >
      <NoteForm
        defaultValues={{
          title: note.title,
          content: note.content ?? '',
          categoryId: note.categoryId,
          tags: note.tags ?? [],
          isPinned: note.isPinned ?? false,
        }}
        onSubmit={handleSubmit}
        isLoading={updateNote.isPending}
        submitLabel="Save Changes"
      />
    </FormSheet>
  );
}
