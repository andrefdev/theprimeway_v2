import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useEffect } from 'react'
import { Toolbar } from './Toolbar'

const lowlight = createLowlight(common)

interface TipTapEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  editable?: boolean
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  editable = true,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline cursor-pointer' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-lg max-w-full' },
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[60vh] px-4 py-3 focus:outline-none ' +
          'prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg ' +
          'prose-a:text-primary prose-a:no-underline hover:prose-a:underline ' +
          'prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs ' +
          'prose-blockquote:border-l-primary/50 prose-blockquote:text-muted-foreground ' +
          'prose-img:rounded-lg prose-pre:bg-muted prose-pre:text-foreground',
      },
    },
  })

  // Sync content from outside when it changes (e.g. on initial load)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null

  return (
    <div className="rounded-lg border border-border bg-background">
      {editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  )
}
