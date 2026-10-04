-- AI Investment Dashboard V6 only.
-- Run once in the existing lanlan-cloud-pet Supabase project's SQL Editor.
-- These tables, policies, trigger, and import RPC are specific to this app.

begin;

create table if not exists public.investment_watchlist (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null check (symbol = upper(btrim(symbol)) and symbol ~ '^[A-Z][A-Z0-9.-]{0,14}$'),
  company_name text,
  market text not null default 'stocks',
  exchange text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investment_watchlist_user_symbol_key unique (user_id, symbol)
);

create table if not exists public.investment_portfolio (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null check (symbol = upper(btrim(symbol)) and symbol ~ '^[A-Z][A-Z0-9.-]{0,14}$'),
  shares numeric not null check (shares > 0),
  average_cost numeric not null check (average_cost > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investment_memories (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null check (symbol = upper(btrim(symbol)) and symbol ~ '^[A-Z][A-Z0-9.-]{0,14}$'),
  why text not null default '',
  buy_thesis text not null default '',
  risks text not null default '',
  exit_conditions text not null default '',
  personal_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investment_memories_user_symbol_key unique (user_id, symbol)
);

create table if not exists public.investment_notes (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text check (symbol is null or (symbol = upper(btrim(symbol)) and symbol ~ '^[A-Z][A-Z0-9.-]{0,14}$')),
  title text not null check (length(btrim(title)) > 0),
  content text not null check (length(btrim(content)) > 0),
  note_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists investment_watchlist_user_updated_idx on public.investment_watchlist (user_id, updated_at desc);
create index if not exists investment_portfolio_user_updated_idx on public.investment_portfolio (user_id, updated_at desc);
create index if not exists investment_memories_user_updated_idx on public.investment_memories (user_id, updated_at desc);
create index if not exists investment_notes_user_updated_idx on public.investment_notes (user_id, updated_at desc);

alter table public.investment_watchlist enable row level security;
alter table public.investment_portfolio enable row level security;
alter table public.investment_memories enable row level security;
alter table public.investment_notes enable row level security;

drop policy if exists investment_watchlist_owner_all on public.investment_watchlist;
create policy investment_watchlist_owner_all on public.investment_watchlist
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists investment_portfolio_owner_all on public.investment_portfolio;
create policy investment_portfolio_owner_all on public.investment_portfolio
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists investment_memories_owner_all on public.investment_memories;
create policy investment_memories_owner_all on public.investment_memories
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists investment_notes_owner_all on public.investment_notes;
create policy investment_notes_owner_all on public.investment_notes
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke all on public.investment_watchlist, public.investment_portfolio,
  public.investment_memories, public.investment_notes from anon, public;
grant select, insert, update, delete on public.investment_watchlist,
  public.investment_portfolio, public.investment_memories, public.investment_notes to authenticated;

create or replace function public.investment_set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.investment_set_updated_at() from public, anon;
grant execute on function public.investment_set_updated_at() to authenticated;

drop trigger if exists investment_watchlist_updated_at on public.investment_watchlist;
create trigger investment_watchlist_updated_at before update on public.investment_watchlist
  for each row execute function public.investment_set_updated_at();
drop trigger if exists investment_portfolio_updated_at on public.investment_portfolio;
create trigger investment_portfolio_updated_at before update on public.investment_portfolio
  for each row execute function public.investment_set_updated_at();
drop trigger if exists investment_memories_updated_at on public.investment_memories;
create trigger investment_memories_updated_at before update on public.investment_memories
  for each row execute function public.investment_set_updated_at();
drop trigger if exists investment_notes_updated_at on public.investment_notes;
create trigger investment_notes_updated_at before update on public.investment_notes
  for each row execute function public.investment_set_updated_at();

create or replace function public.investment_import_local_data(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_watchlist_count integer := 0;
  v_portfolio_count integer := 0;
  v_memory_count integer := 0;
  v_notes_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to import investment data.';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Import payload must be a JSON object.';
  end if;
  if jsonb_typeof(coalesce(p_payload->'watchlist', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_payload->'portfolio', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_payload->'investment_memory', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_payload->'investment_notes', '[]'::jsonb)) <> 'array' then
    raise exception 'All four imported data collections must be JSON arrays.';
  end if;

  -- Serialize imports for this user. If any cloud data exists, keep it intact.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_user_id::text));
  if exists (select 1 from public.investment_watchlist where user_id = v_user_id)
    or exists (select 1 from public.investment_portfolio where user_id = v_user_id)
    or exists (select 1 from public.investment_memories where user_id = v_user_id)
    or exists (select 1 from public.investment_notes where user_id = v_user_id) then
    return jsonb_build_object('imported', false, 'reason', 'cloud_not_empty');
  end if;

  insert into public.investment_watchlist (user_id, symbol, company_name, market, exchange)
    select v_user_id, upper(btrim(item.symbol)), nullif(btrim(item.company_name), ''),
      coalesce(nullif(btrim(item.market), ''), 'stocks'), nullif(btrim(item.exchange), '')
    from jsonb_to_recordset(coalesce(p_payload->'watchlist', '[]'::jsonb))
      as item(symbol text, company_name text, market text, exchange text);
  get diagnostics v_watchlist_count = row_count;

  insert into public.investment_portfolio (id, user_id, symbol, shares, average_cost)
    select coalesce(nullif(item.id, ''), gen_random_uuid()::text), v_user_id,
      upper(btrim(item.symbol)), item.shares, item.average_cost
    from jsonb_to_recordset(coalesce(p_payload->'portfolio', '[]'::jsonb))
      as item(id text, symbol text, shares numeric, average_cost numeric);
  get diagnostics v_portfolio_count = row_count;

  insert into public.investment_memories (user_id, symbol, why, buy_thesis, risks, exit_conditions, personal_notes)
    select v_user_id, upper(btrim(item.symbol)), coalesce(item.why, ''), coalesce(item.buy_thesis, ''),
      coalesce(item.risks, ''), coalesce(item.exit_conditions, ''), coalesce(item.personal_notes, '')
    from jsonb_to_recordset(coalesce(p_payload->'investment_memory', '[]'::jsonb))
      as item(symbol text, why text, buy_thesis text, risks text, exit_conditions text, personal_notes text);
  get diagnostics v_memory_count = row_count;

  insert into public.investment_notes (id, user_id, symbol, title, content, note_date, created_at, updated_at)
    select coalesce(nullif(item.id, ''), gen_random_uuid()::text), v_user_id,
      nullif(upper(btrim(item.symbol)), ''), item.title, item.content, item.note_date,
      coalesce(item.created_at, now()), coalesce(item.updated_at, item.created_at, now())
    from jsonb_to_recordset(coalesce(p_payload->'investment_notes', '[]'::jsonb))
      as item(id text, symbol text, title text, content text, note_date date, created_at timestamptz, updated_at timestamptz);
  get diagnostics v_notes_count = row_count;

  return jsonb_build_object('imported', true, 'counts', jsonb_build_object(
    'watchlist', v_watchlist_count, 'portfolio', v_portfolio_count,
    'investment_memory', v_memory_count, 'investment_notes', v_notes_count
  ));
end;
$$;

revoke all on function public.investment_import_local_data(jsonb) from public, anon, authenticated;
grant execute on function public.investment_import_local_data(jsonb) to authenticated;

commit;
