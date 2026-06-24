'use client'

import dynamic from 'next/dynamic'
import '@uiw/react-md-editor/markdown-editor.css'

export const MarkdownEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
})

export const MarkdownPreview = dynamic(
  () => import('@uiw/react-md-editor').then(mod => mod.default.Markdown),
  { ssr: false },
)
