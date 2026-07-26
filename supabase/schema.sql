-- ============================================================
--  FINANCIAL LEDGER — DATABASE SCHEMA
-- ============================================================
--  HOW TO USE THIS FILE:
--    1. Go to your Supabase project.
--    2. Open the "SQL Editor" (left sidebar).
--    3. Click "New query", paste this ENTIRE file, click "Run".
--  It's safe to run more than once (it uses IF NOT EXISTS etc.).
--
--  SECURITY MODEL:
--    Every table has "Row-Level Security" (RLS) turned on with
--    policies that check `auth.uid() = user_id`. In plain terms:
--    the database itself refuses to return one person's rows to
--    anyone else — even if the app had a bug. Your money data is
--    locked to your account at the deepest level.
-- ============================================================

-- Money is stored as NUMERIC(14,2): exact decimals, no floating
-- point rounding errors. Max value ~999 billion — plenty.

-- ------------------------------------------------------------
-- ACCOUNTS  (checking, savings, credit card, cash, etc.)
-- ------------------------------------------------------------
create table if not exists public.accounts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  name              text not null,
  type              text not null default 'checking',
  currency          text not null default 'USD',
  starting_balance  numeric(14,2) not null default 0,
  archived          boolean not null default false,
  created_at        timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CATEGORIES  (Groceries, Salary, Rent, ...)
-- ------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  kind        text not null default 'expense',  -- 'income' | 'expense'
  color       text not null default '#6366f1',
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TRANSACTIONS  (the actual ledger entries)
-- ------------------------------------------------------------
--  amount is ALWAYS a positive number. `type` says the direction:
--    income   -> adds to the account
--    expense  -> subtracts from the account
--    transfer -> moves money to transfer_account_id
create table if not exists public.transactions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  account_id           uuid not null references public.accounts (id) on delete cascade,
  category_id          uuid references public.categories (id) on delete set null,
  type                 text not null default 'expense',
  amount               numeric(14,2) not null check (amount >= 0),
  description          text,
  date                 date not null default current_date,
  transfer_account_id  uuid references public.accounts (id) on delete set null,
  created_at           timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);
create index if not exists transactions_account_idx
  on public.transactions (account_id);

-- ------------------------------------------------------------
-- BUDGETS  (spending limit per category per month)
-- ------------------------------------------------------------
create table if not exists public.budgets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  category_id  uuid not null references public.categories (id) on delete cascade,
  amount       numeric(14,2) not null check (amount >= 0),
  month        date not null,   -- first day of the month, e.g. 2026-07-01
  created_at   timestamptz not null default now(),
  unique (user_id, category_id, month)
);

-- ------------------------------------------------------------
-- GOALS  (savings goals)
-- ------------------------------------------------------------
create table if not exists public.goals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  target_amount   numeric(14,2) not null check (target_amount >= 0),
  current_amount  numeric(14,2) not null default 0,
  target_date     date,
  created_at      timestamptz not null default now()
);

-- ------------------------------------------------------------
-- RECURRING TRANSACTIONS  (subscriptions, salary, rent, ...)
-- ------------------------------------------------------------
create table if not exists public.recurring_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  account_id   uuid not null references public.accounts (id) on delete cascade,
  category_id  uuid references public.categories (id) on delete set null,
  type         text not null default 'expense',
  amount       numeric(14,2) not null check (amount >= 0),
  description  text,
  frequency    text not null default 'monthly',  -- daily|weekly|monthly|yearly
  next_date    date not null,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ============================================================
--  ACCOUNT BALANCES VIEW
--  Computes each account's current balance =
--    starting_balance
--    + income
--    - expenses
--    - transfers out
--    + transfers in
--  So you never have to store/maintain a balance by hand.
-- ============================================================
create or replace view public.account_balances
with (security_invoker = true) as
select
  a.id as account_id,
  a.user_id,
  a.name,
  a.type,
  a.currency,
  a.starting_balance
    + coalesce(sum(case when t.type = 'income'   then t.amount else 0 end), 0)
    - coalesce(sum(case when t.type = 'expense'  then t.amount else 0 end), 0)
    - coalesce(sum(case when t.type = 'transfer' then t.amount else 0 end), 0)
    + coalesce((
        select sum(t2.amount)
        from public.transactions t2
        where t2.transfer_account_id = a.id and t2.type = 'transfer'
      ), 0)
    as balance
from public.accounts a
left join public.transactions t on t.account_id = a.id
group by a.id;

-- ============================================================
--  ROW-LEVEL SECURITY
--  Turn it on, then add policies so users only touch their rows.
-- ============================================================
alter table public.accounts               enable row level security;
alter table public.categories             enable row level security;
alter table public.transactions           enable row level security;
alter table public.budgets                enable row level security;
alter table public.goals                  enable row level security;
alter table public.recurring_transactions enable row level security;

-- Helper: create the 4 standard policies (select/insert/update/delete)
-- for a table, each scoped to the logged-in user. We inline them per
-- table for clarity.

-- accounts
drop policy if exists "own accounts" on public.accounts;
create policy "own accounts" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- categories
drop policy if exists "own categories" on public.categories;
create policy "own categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- transactions
drop policy if exists "own transactions" on public.transactions;
create policy "own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- budgets
drop policy if exists "own budgets" on public.budgets;
create policy "own budgets" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- goals
drop policy if exists "own goals" on public.goals;
create policy "own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- recurring_transactions
drop policy if exists "own recurring" on public.recurring_transactions;
create policy "own recurring" on public.recurring_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
--  STARTER CATEGORIES FOR NEW USERS
--  When someone signs up, give them a sensible starting set of
--  categories so the app is useful immediately.
-- ============================================================
create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.categories (user_id, name, kind, color) values
    (new.id, 'Salary',        'income',  '#22c55e'),
    (new.id, 'Other Income',  'income',  '#16a34a'),
    (new.id, 'Groceries',     'expense', '#f97316'),
    (new.id, 'Rent/Mortgage', 'expense', '#ef4444'),
    (new.id, 'Utilities',     'expense', '#eab308'),
    (new.id, 'Transport',     'expense', '#3b82f6'),
    (new.id, 'Dining Out',    'expense', '#ec4899'),
    (new.id, 'Shopping',      'expense', '#a855f7'),
    (new.id, 'Health',        'expense', '#14b8a6'),
    (new.id, 'Entertainment', 'expense', '#8b5cf6'),
    (new.id, 'Other',         'expense', '#64748b');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_default_categories();

-- ============================================================
--  DONE. Your database is ready.
-- ============================================================
