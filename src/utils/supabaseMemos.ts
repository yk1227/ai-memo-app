import { Memo } from '@/types/memo'
import { getSupabaseClient } from './supabaseClient'

interface MemoRow {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  summary: string | null
  created_at: string
  updated_at: string
}

function rowToMemo(row: MemoRow): Memo {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    tags: row.tags,
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function memoToRow(memo: Memo): MemoRow {
  return {
    id: memo.id,
    title: memo.title,
    content: memo.content,
    category: memo.category,
    tags: memo.tags,
    summary: memo.summary ?? null,
    created_at: memo.createdAt,
    updated_at: memo.updatedAt,
  }
}

export const supabaseMemos = {
  getMemos: async (): Promise<Memo[]> => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading memos from Supabase:', error)
      return []
    }

    return (data as MemoRow[]).map(rowToMemo)
  },

  addMemo: async (memo: Memo): Promise<void> => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('memos').insert(memoToRow(memo))

    if (error) {
      console.error('Error adding memo to Supabase:', error)
      throw error
    }
  },

  addMemos: async (memos: Memo[]): Promise<void> => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('memos').insert(memos.map(memoToRow))

    if (error) {
      console.error('Error bulk inserting memos to Supabase:', error)
      throw error
    }
  },

  updateMemo: async (updatedMemo: Memo): Promise<void> => {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('memos')
      .update({
        title: updatedMemo.title,
        content: updatedMemo.content,
        category: updatedMemo.category,
        tags: updatedMemo.tags,
        summary: updatedMemo.summary ?? null,
        updated_at: updatedMemo.updatedAt,
      })
      .eq('id', updatedMemo.id)

    if (error) {
      console.error('Error updating memo in Supabase:', error)
      throw error
    }
  },

  updateSummary: async (id: string, summary: string): Promise<void> => {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('memos')
      .update({
        summary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating memo summary in Supabase:', error)
      throw error
    }
  },

  deleteMemo: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('memos').delete().eq('id', id)

    if (error) {
      console.error('Error deleting memo from Supabase:', error)
      throw error
    }
  },

  clearMemos: async (): Promise<void> => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('memos').delete().neq('id', '')

    if (error) {
      console.error('Error clearing memos from Supabase:', error)
      throw error
    }
  },

  count: async (): Promise<number> => {
    const supabase = getSupabaseClient()
    const { count, error } = await supabase
      .from('memos')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error counting memos in Supabase:', error)
      return 0
    }

    return count ?? 0
  },
}
