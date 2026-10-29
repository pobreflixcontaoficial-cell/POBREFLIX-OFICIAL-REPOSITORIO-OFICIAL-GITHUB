-- Execute este arquivo no SQL Editor do projeto Supabase antes de usar o painel.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists bio text not null default '';

create table if not exists public.titles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  content_type text not null default 'movie',
  video_url text not null default '',
  poster_url text not null default '',
  banner_url text not null default '',
  genre text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_servers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_url text not null default '',
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.video_players (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.media_servers(id) on delete cascade,
  name text not null,
  player_type text not null default 'direct' check (player_type in ('direct','hls','embed')),
  voice_language text not null default 'original',
  voice_name text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.title_sources (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references public.titles(id) on delete cascade,
  player_id uuid not null references public.video_players(id) on delete cascade,
  label text not null default '',
  video_url text not null,
  audio_language text not null default 'original',
  voice_name text not null default '',
  subtitle_language text not null default 'none',
  subtitle_url text not null default '',
  sort_order integer not null default 0,
  is_default boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, title_id)
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null default '',
  email text not null default '',
  message text not null,
  status text not null default 'new' check (status in ('new','read','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.seo_settings (
  id uuid primary key default gen_random_uuid(),
  page_path text unique not null,
  title text not null default '',
  description text not null default '',
  keywords text not null default '',
  head_tags text not null default '',
  body_tags text not null default '',
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.titles add column if not exists content_type text not null default 'movie';
alter table public.titles add column if not exists banner_url text not null default '';
alter table public.video_players add column if not exists voice_language text not null default 'original';
alter table public.video_players add column if not exists voice_name text not null default '';
alter table public.title_sources add column if not exists audio_language text not null default 'original';
alter table public.title_sources add column if not exists voice_name text not null default '';
alter table public.title_sources add column if not exists subtitle_language text not null default 'none';
alter table public.title_sources add column if not exists subtitle_url text not null default '';

create index if not exists idx_titles_published_created on public.titles (published, created_at desc);
create index if not exists idx_contact_messages_status_created on public.contact_messages (status, created_at desc);
create index if not exists idx_profiles_created on public.profiles (created_at desc);
create index if not exists idx_servers_active on public.media_servers (active, created_at desc);
create index if not exists idx_players_server_active on public.video_players (server_id, active, created_at desc);
create index if not exists idx_sources_title_active on public.title_sources (title_id, active, sort_order);

create or replace function public.is_pobreflix_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select auth.uid() = '01fbcfb4-5943-4c96-bd28-f21cf64a850f'::uuid $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.titles enable row level security;
alter table public.media_servers enable row level security;
alter table public.video_players enable row level security;
alter table public.title_sources enable row level security;
alter table public.favorites enable row level security;
alter table public.contact_messages enable row level security;
alter table public.seo_settings enable row level security;

-- Perfis
drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles for select using (auth.uid() = id or public.is_pobreflix_admin());
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update using (auth.uid() = id or public.is_pobreflix_admin()) with check (auth.uid() = id or public.is_pobreflix_admin());
drop policy if exists "profiles own insert" on public.profiles;
create policy "profiles own insert" on public.profiles for insert with check (auth.uid() = id);

-- Títulos
drop policy if exists "published titles read" on public.titles;
create policy "published titles read" on public.titles for select using (published = true or public.is_pobreflix_admin());
drop policy if exists "admin titles insert" on public.titles;
create policy "admin titles insert" on public.titles for insert with check (public.is_pobreflix_admin());
drop policy if exists "admin titles update" on public.titles;
create policy "admin titles update" on public.titles for update using (public.is_pobreflix_admin()) with check (public.is_pobreflix_admin());
drop policy if exists "admin titles delete" on public.titles;
create policy "admin titles delete" on public.titles for delete using (public.is_pobreflix_admin());

-- Servidores, players e fontes: público somente lê itens ativos; o administrador gerencia tudo.
drop policy if exists "public active servers read" on public.media_servers;
drop policy if exists "public active players read" on public.video_players;
drop policy if exists "public active sources read" on public.title_sources;
drop policy if exists "admin servers insert" on public.media_servers;
drop policy if exists "admin servers update" on public.media_servers;
drop policy if exists "admin servers delete" on public.media_servers;
drop policy if exists "admin players insert" on public.video_players;
drop policy if exists "admin players update" on public.video_players;
drop policy if exists "admin players delete" on public.video_players;
drop policy if exists "admin sources insert" on public.title_sources;
drop policy if exists "admin sources update" on public.title_sources;
drop policy if exists "admin sources delete" on public.title_sources;
create policy "public active servers read" on public.media_servers for select using (active = true or public.is_pobreflix_admin());
create policy "admin servers insert" on public.media_servers for insert with check (public.is_pobreflix_admin());
create policy "admin servers update" on public.media_servers for update using (public.is_pobreflix_admin()) with check (public.is_pobreflix_admin());
create policy "admin servers delete" on public.media_servers for delete using (public.is_pobreflix_admin());
create policy "public active players read" on public.video_players for select using (active = true or public.is_pobreflix_admin());
create policy "admin players insert" on public.video_players for insert with check (public.is_pobreflix_admin());
create policy "admin players update" on public.video_players for update using (public.is_pobreflix_admin()) with check (public.is_pobreflix_admin());
create policy "admin players delete" on public.video_players for delete using (public.is_pobreflix_admin());
create policy "public active sources read" on public.title_sources for select using (
  (active = true and exists (
    select 1 from public.titles t
    where t.id = title_sources.title_id and t.published = true
  ))
  or public.is_pobreflix_admin()
);
create policy "admin sources insert" on public.title_sources for insert with check (public.is_pobreflix_admin());
create policy "admin sources update" on public.title_sources for update using (public.is_pobreflix_admin()) with check (public.is_pobreflix_admin());
create policy "admin sources delete" on public.title_sources for delete using (public.is_pobreflix_admin());

-- Favoritos
drop policy if exists "favorites own all" on public.favorites;
create policy "favorites own all" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Contato
drop policy if exists "contact public insert" on public.contact_messages;
create policy "contact public insert" on public.contact_messages for insert with check (
  (user_id is null or user_id = auth.uid())
  and char_length(coalesce(message, '')) between 1 and 5000
  and char_length(coalesce(name, '')) between 0 and 120
  and char_length(coalesce(email, '')) between 0 and 254
);
drop policy if exists "admin contact read" on public.contact_messages;
create policy "admin contact read" on public.contact_messages for select using (public.is_pobreflix_admin());
drop policy if exists "admin contact update" on public.contact_messages;
create policy "admin contact update" on public.contact_messages for update using (public.is_pobreflix_admin()) with check (public.is_pobreflix_admin());

-- SEO
drop policy if exists "published seo read" on public.seo_settings;
create policy "published seo read" on public.seo_settings for select using (published = true or public.is_pobreflix_admin());
drop policy if exists "admin seo insert" on public.seo_settings;
create policy "admin seo insert" on public.seo_settings for insert with check (public.is_pobreflix_admin());
drop policy if exists "admin seo update" on public.seo_settings;
create policy "admin seo update" on public.seo_settings for update using (public.is_pobreflix_admin()) with check (public.is_pobreflix_admin());
drop policy if exists "admin seo delete" on public.seo_settings;
create policy "admin seo delete" on public.seo_settings for delete using (public.is_pobreflix_admin());

insert into public.seo_settings (page_path, title, description, keywords)
values
  ('/', 'Pobreflix — Entretenimento sem complicação', 'Explore o catálogo Pobreflix, encontre novidades e continue assistindo em uma experiência simples e rápida.', 'pobreflix, catálogo, filmes, séries'),
  ('/catalago', 'Catálogo Pobreflix — Filmes e séries', 'Navegue pelo catálogo Pobreflix e encontre o próximo título para assistir.', 'pobreflix, filmes, séries, catálogo')
on conflict (page_path) do nothing;
