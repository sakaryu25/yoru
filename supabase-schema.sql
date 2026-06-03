-- CastBoard Supabase Schema

create table if not exists casts (
  id bigint primary key generated always as identity,
  company_id text not null,
  name text not null,
  rank text not null default 'Regular',
  monthly_sales bigint not null default 0,
  monthly_goal bigint not null default 500000,
  salary_estimate bigint not null default 0,
  nominations int not null default 0,
  drinks int not null default 0,
  work_days int not null default 0,
  rank_num int not null default 1,
  prev_month_ratio int not null default 0,
  status text not null default '在籍中',
  hourly_rate int not null default 2000,
  bottle_sales bigint not null default 0,
  cheki int not null default 0,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table if not exists missions (
  id bigint primary key generated always as identity,
  company_id text not null,
  title text not null,
  condition text not null default '',
  target int not null default 5,
  current int not null default 0,
  reward text not null default '+¥1,000',
  deadline text not null default '今週末まで',
  achievers int not null default 0,
  total int not null default 12,
  created_at timestamptz not null default now()
);

create table if not exists performance_records (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  date text not null,
  cast_name text not null,
  hours numeric not null default 0,
  sales bigint not null default 0,
  salary bigint not null default 0,
  nominations int not null default 0,
  floor_nominations int not null default 0,
  drinks int not null default 0,
  bottle_sales bigint not null default 0,
  cheki int not null default 0,
  other_back bigint not null default 0,
  memo text not null default '',
  saved_at timestamptz not null default now()
);

create table if not exists announcements (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  title text not null,
  body text not null default '',
  priority text not null default 'normal',
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS
alter table casts enable row level security;
alter table missions enable row level security;
alter table performance_records enable row level security;
alter table announcements enable row level security;

-- Allow anon read/write (company_id acts as the auth)
create policy "anon all" on casts for all using (true);
create policy "anon all" on missions for all using (true);
create policy "anon all" on performance_records for all using (true);
create policy "anon all" on announcements for all using (true);

-- Realtime
alter publication supabase_realtime add table missions;
alter publication supabase_realtime add table announcements;
