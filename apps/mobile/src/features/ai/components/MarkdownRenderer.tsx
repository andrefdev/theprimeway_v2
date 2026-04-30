import Markdown from 'react-native-markdown-display';
import { useColorScheme } from 'nativewind';

interface Props {
  content: string;
  invert?: boolean;
}

export function MarkdownRenderer({ content, invert }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const fg = invert
    ? '#ffffff'
    : isDark
      ? 'hsl(210, 20%, 95%)'
      : 'hsl(210, 20%, 12%)';
  const muted = invert ? 'rgba(255,255,255,0.7)' : isDark ? 'hsl(210, 10%, 65%)' : 'hsl(210, 10%, 45%)';
  const codeBg = invert ? 'rgba(0,0,0,0.2)' : isDark ? 'hsl(210, 15%, 18%)' : 'hsl(210, 15%, 92%)';
  const link = invert ? '#cfd9ff' : 'hsl(246, 97%, 60%)';

  return (
    <Markdown
      style={{
        body: { color: fg, fontSize: 14, lineHeight: 20 },
        paragraph: { color: fg, marginTop: 0, marginBottom: 6 },
        strong: { color: fg, fontWeight: '700' },
        em: { color: fg, fontStyle: 'italic' },
        bullet_list: { marginVertical: 4 },
        ordered_list: { marginVertical: 4 },
        list_item: { color: fg, marginVertical: 2 },
        heading1: { color: fg, fontSize: 18, fontWeight: '700', marginTop: 8, marginBottom: 4 },
        heading2: { color: fg, fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 4 },
        heading3: { color: fg, fontSize: 14, fontWeight: '700', marginTop: 6, marginBottom: 4 },
        code_inline: {
          color: fg,
          backgroundColor: codeBg,
          paddingHorizontal: 4,
          paddingVertical: 1,
          borderRadius: 4,
          fontFamily: 'Menlo',
          fontSize: 12,
        },
        code_block: {
          color: fg,
          backgroundColor: codeBg,
          padding: 8,
          borderRadius: 8,
          fontFamily: 'Menlo',
          fontSize: 12,
        },
        fence: {
          color: fg,
          backgroundColor: codeBg,
          padding: 8,
          borderRadius: 8,
          fontFamily: 'Menlo',
          fontSize: 12,
        },
        blockquote: {
          borderLeftWidth: 3,
          borderLeftColor: muted,
          paddingLeft: 8,
          color: muted,
        },
        link: { color: link },
        hr: { backgroundColor: muted, height: 1, marginVertical: 8 },
      }}
    >
      {content}
    </Markdown>
  );
}
