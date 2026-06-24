import { useState, useCallback } from 'react'
import { Memo } from '@/types/memo'

interface UseSummarizeReturn {
  summary: string | null
  isLoading: boolean
  error: string | null
  summarize: (memo: Memo) => Promise<string | null>
  reset: () => void
}

export function useSummarize(): UseSummarizeReturn {
  const [summary, setSummary] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const summarize = useCallback(async (memo: Memo): Promise<string | null> => {
    setIsLoading(true)
    setSummary(null)
    setError(null)

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: memo.title, content: memo.content }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'AI 요약 중 오류가 발생했습니다.')
        return null
      }

      const result = data.summary ?? null
      setSummary(result)
      return result
    } catch {
      setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setSummary(null)
    setIsLoading(false)
    setError(null)
  }, [])

  return { summary, isLoading, error, summarize, reset }
}
