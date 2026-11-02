-- Routine, completamenti e note giornaliere. Ogni riga appartiene a un utente
-- e la RLS garantisce che ognuno veda solo le proprie.

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  -- giorni attivi: 0 = domenica ... 6 = sabato
  days smallint[] not null default '{0,1,2,3,4,5,6}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.completions (
  routine_id uuid not null references public.routines(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (routine_id, day)
);

create table public.day_notes (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  body text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.routines enable row level security;
alter table public.completions enable row level security;
alter table public.day_notes enable row level security;

create policy "own routines" on public.routines
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own completions" on public.completions
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own notes" on public.day_notes
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
