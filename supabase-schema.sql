-- ============================================================
-- ChoreTracker Schema
-- Paste this into Supabase → SQL Editor → Run
-- ============================================================

-- Profiles (one per auth user)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null check (role in ('parent', 'child')),
  avatar_emoji text not null default '🦁',
  avatar_color text not null default 'bg-indigo-500',
  monthly_cap numeric not null default 0,
  created_at timestamptz default now()
);

-- Chores (definitions)
create table if not exists chores (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  assigned_user_id uuid references profiles(id) on delete cascade not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'anytime')),
  value numeric not null default 0,
  verification_type text not null default 'photo',
  checklist_items text[] not null default '{}',
  requires_before_after boolean not null default false,
  active boolean not null default true,
  due_time text not null default '20:00',
  week_days int[] not null default '{}',
  created_at timestamptz default now()
);

-- Chore instances (one per day/week per chore)
create table if not exists chore_instances (
  id uuid primary key default gen_random_uuid(),
  chore_id uuid references chores(id) on delete cascade not null,
  assigned_user_id uuid references profiles(id) on delete cascade not null,
  due_date date not null,
  status text not null default 'pending' check (status in ('pending','submitted','approved','rejected','overdue')),
  created_at timestamptz default now(),
  unique(chore_id, due_date)
);

-- Proofs (photo + checklist submissions)
create table if not exists proofs (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid references chore_instances(id) on delete cascade not null unique,
  user_id uuid references profiles(id) on delete cascade not null,
  photo_before text,
  photo_after text,
  checklist_done text[] not null default '{}',
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewer_note text
);

-- Payouts (monthly earnings records)
create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  month text not null,
  amount numeric not null default 0,
  paid_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, month)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table chores enable row level security;
alter table chore_instances enable row level security;
alter table proofs enable row level security;
alter table payouts enable row level security;

-- Profiles: everyone sees all profiles, only you can update yours
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Chores: parents see all, kids see only their own
create policy "chores_parent_all" on chores for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'parent'));
create policy "chores_child_select" on chores for select
  using (assigned_user_id = auth.uid());

-- Instances: parents see all, kids see only their own
create policy "instances_parent_all" on chore_instances for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'parent'));
create policy "instances_child_select" on chore_instances for select
  using (assigned_user_id = auth.uid());
create policy "instances_child_update" on chore_instances for update
  using (assigned_user_id = auth.uid());

-- Proofs: parents see all, kids manage their own
create policy "proofs_parent_all" on proofs for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'parent'));
create policy "proofs_child_select" on proofs for select
  using (user_id = auth.uid());
create policy "proofs_child_insert" on proofs for insert
  with check (user_id = auth.uid());

-- Payouts: parents manage all, kids read their own
create policy "payouts_parent_all" on payouts for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'parent'));
create policy "payouts_child_select" on payouts for select
  using (user_id = auth.uid());

-- ============================================================
-- Auto-create profile on signup
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, role, avatar_emoji, avatar_color, monthly_cap)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'child'),
    coalesce(new.raw_user_meta_data->>'avatar_emoji', '🦁'),
    coalesce(new.raw_user_meta_data->>'avatar_color', 'bg-indigo-500'),
    coalesce((new.raw_user_meta_data->>'monthly_cap')::numeric, 100)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
