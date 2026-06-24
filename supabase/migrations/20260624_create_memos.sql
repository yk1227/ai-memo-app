-- Memo 앱 메모 테이블 생성 마이그레이션
-- Supabase 대시보드 SQL Editor에서 실행하거나 apply_migration MCP 툴로 적용

create table if not exists public.memos (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  content text not null default '',
  category text not null default 'other',
  tags text[] not null default '{}',
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.memos enable row level security;

-- 인증 없는 단일 공용 접근 (anon 전체 허용)
create policy "memos_public_all" on public.memos
  for all to anon using (true) with check (true);

create index if not exists memos_created_at_idx on public.memos (created_at desc);
