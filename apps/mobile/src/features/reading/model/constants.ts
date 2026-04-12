export const OPEN_LIBRARY_COVERS_URL = 'https://covers.openlibrary.org';

export function buildCoverUrl(coverId: number, size: 'S' | 'M' | 'L' = 'M'): string {
  return `${OPEN_LIBRARY_COVERS_URL}/b/id/${coverId}-${size}.jpg`;
}

export function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

export const RECOMMENDED_BOOKS = [
  { workKey: '/works/OL15413843W', title: 'Atomic Habits', author: 'James Clear' },
  { workKey: '/works/OL17930368W', title: 'Deep Work', author: 'Cal Newport' },
  { workKey: '/works/OL17356524W', title: 'The 7 Habits of Highly Effective People', author: 'Stephen Covey' },
  { workKey: '/works/OL5735363W', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman' },
  { workKey: '/works/OL276648W', title: 'The Power of Habit', author: 'Charles Duhigg' },
  { workKey: '/works/OL16800509W', title: 'Essentialism', author: 'Greg McKeown' },
  { workKey: '/works/OL17839718W', title: 'Mindset', author: 'Carol Dweck' },
  { workKey: '/works/OL21033088W', title: "Can't Hurt Me", author: 'David Goggins' },
] as const;

export const STATUS_OPTIONS = [
  { value: 'to_read', label: 'To Read' },
  { value: 'in_progress', label: 'Reading' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'abandoned', label: 'Abandoned' },
] as const;
