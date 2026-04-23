-- Create posts table
create table posts (
  id bigint primary key generated always as identity,
  created_at timestamptz default now(),
  content text not null,
  author_name text not null,
  author_role text not null,
  likes integer default 0,
  replies integer default 0
);

-- Create messages table
create table messages (
  id bigint primary key generated always as identity,
  sender_id text not null,
  text text not null,
  created_at timestamptz default now()
);

-- Turn off RLS for local dev
alter table posts disable row level security;
alter table messages disable row level security;

-- Enable Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table messages;
