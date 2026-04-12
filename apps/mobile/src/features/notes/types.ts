import { z } from 'zod/v4';

export const noteFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  categoryId: z.string().optional(),
  isPinned: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const noteCategoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().optional(),
});

export type NoteFormData = z.infer<typeof noteFormSchema>;
export type NoteCategoryFormData = z.infer<typeof noteCategoryFormSchema>;
