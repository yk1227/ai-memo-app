'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Memo, MemoFormData } from '@/types/memo'
import { supabaseMemos } from '@/utils/supabaseMemos'
import { sampleMemos } from '@/utils/seedData'

const LS_MIGRATION_FLAG = 'memo-app-migrated-to-supabase'
const LS_STORAGE_KEY = 'memo-app-memos'

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // 메모 로드 (초기 마이그레이션 포함)
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const dbMemos = await supabaseMemos.getMemos()

        // LocalStorage에 기존 데이터가 있고 아직 마이그레이션 안 된 경우 1회 업로드
        if (
          typeof window !== 'undefined' &&
          !localStorage.getItem(LS_MIGRATION_FLAG)
        ) {
          const raw = localStorage.getItem(LS_STORAGE_KEY)
          const lsMemos: Memo[] = raw ? JSON.parse(raw) : []

          if (lsMemos.length > 0 && dbMemos.length === 0) {
            // 기존 LocalStorage 데이터를 Supabase로 1회 업로드
            await supabaseMemos.addMemos(lsMemos)
            const uploaded = await supabaseMemos.getMemos()
            setMemos(uploaded)
          } else if (dbMemos.length === 0) {
            // DB와 LS 모두 비어 있으면 샘플 데이터 시드
            await supabaseMemos.addMemos(sampleMemos)
            const seeded = await supabaseMemos.getMemos()
            setMemos(seeded)
          } else {
            setMemos(dbMemos)
          }

          localStorage.setItem(LS_MIGRATION_FLAG, 'true')
        } else {
          setMemos(dbMemos)
        }
      } catch (error) {
        console.error('Failed to load memos:', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // 메모 생성
  const createMemo = useCallback(async (formData: MemoFormData): Promise<Memo> => {
    const newMemo: Memo = {
      id: uuidv4(),
      ...formData,
      summary: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setMemos(prev => [newMemo, ...prev])

    try {
      await supabaseMemos.addMemo(newMemo)
    } catch {
      setMemos(prev => prev.filter(m => m.id !== newMemo.id))
      throw new Error('메모 저장에 실패했습니다.')
    }

    return newMemo
  }, [])

  // 메모 업데이트
  const updateMemo = useCallback(
    async (id: string, formData: MemoFormData): Promise<void> => {
      const existingMemo = memos.find(memo => memo.id === id)
      if (!existingMemo) return

      const updatedMemo: Memo = {
        ...existingMemo,
        ...formData,
        updatedAt: new Date().toISOString(),
      }

      setMemos(prev => prev.map(memo => (memo.id === id ? updatedMemo : memo)))

      try {
        await supabaseMemos.updateMemo(updatedMemo)
      } catch {
        setMemos(prev => prev.map(memo => (memo.id === id ? existingMemo : memo)))
        throw new Error('메모 수정에 실패했습니다.')
      }
    },
    [memos]
  )

  // 메모 삭제
  const deleteMemo = useCallback(async (id: string): Promise<void> => {
    const snapshot = memos.find(m => m.id === id)
    setMemos(prev => prev.filter(memo => memo.id !== id))

    try {
      await supabaseMemos.deleteMemo(id)
    } catch {
      if (snapshot) setMemos(prev => [snapshot, ...prev])
      throw new Error('메모 삭제에 실패했습니다.')
    }
  }, [memos])

  // AI 요약 영속화
  const updateMemoSummary = useCallback(
    async (id: string, summary: string): Promise<void> => {
      setMemos(prev =>
        prev.map(memo =>
          memo.id === id
            ? { ...memo, summary, updatedAt: new Date().toISOString() }
            : memo
        )
      )

      try {
        await supabaseMemos.updateSummary(id, summary)
      } catch {
        console.error('요약 저장에 실패했습니다.')
      }
    },
    []
  )

  // 메모 검색
  const searchMemos = useCallback((query: string): void => {
    setSearchQuery(query)
  }, [])

  // 카테고리 필터링
  const filterByCategory = useCallback((category: string): void => {
    setSelectedCategory(category)
  }, [])

  // 특정 메모 가져오기
  const getMemoById = useCallback(
    (id: string): Memo | undefined => {
      return memos.find(memo => memo.id === id)
    },
    [memos]
  )

  // 필터링된 메모 목록
  const filteredMemos = useMemo(() => {
    let filtered = memos

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        memo =>
          memo.title.toLowerCase().includes(query) ||
          memo.content.toLowerCase().includes(query) ||
          memo.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [memos, selectedCategory, searchQuery])

  // 모든 메모 삭제
  const clearAllMemos = useCallback(async (): Promise<void> => {
    const snapshot = [...memos]
    setMemos([])
    setSearchQuery('')
    setSelectedCategory('all')

    try {
      await supabaseMemos.clearMemos()
    } catch {
      setMemos(snapshot)
      throw new Error('전체 삭제에 실패했습니다.')
    }
  }, [memos])

  // 통계 정보
  const stats = useMemo(() => {
    const totalMemos = memos.length
    const categoryCounts = memos.reduce(
      (acc, memo) => {
        acc[memo.category] = (acc[memo.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: totalMemos,
      byCategory: categoryCounts,
      filtered: filteredMemos.length,
    }
  }, [memos, filteredMemos])

  return {
    memos: filteredMemos,
    allMemos: memos,
    loading,
    searchQuery,
    selectedCategory,
    stats,

    createMemo,
    updateMemo,
    deleteMemo,
    updateMemoSummary,
    getMemoById,

    searchMemos,
    filterByCategory,

    clearAllMemos,
  }
}
