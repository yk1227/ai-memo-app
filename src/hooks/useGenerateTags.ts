import { useState, useCallback } from 'react'

interface UseGenerateTagsReturn {
  tags: string[] | null
  isLoading: boolean
  error: string | null
  generateTags: (title: string, content: string) => Promise<void>
  reset: () => void
}

export function useGenerateTags(): UseGenerateTagsReturn {
  const [tags, setTags] = useState<string[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateTags = useCallback(async (title: string, content: string) => {
    setIsLoading(true)
    setTags(null)
    setError(null)

    try {
      const response = await fetch('/api/generate-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'AI 태그 생성 중 오류가 발생했습니다.')
        return
      }

      setTags(data.tags ?? null)
    } catch {
      setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setTags(null)
    setIsLoading(false)
    setError(null)
  }, [])

  return { tags, isLoading, error, generateTags, reset }
}
