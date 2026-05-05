-- Resources table for PDF / Ebook management
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.resources (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	file_url text not null,
	is_free boolean not null default false,
	visible boolean not null default true,
	"order" integer not null default 0,
	size_bytes integer,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_resources_is_free_visible on public.resources (is_free, visible);
create index if not exists idx_resources_order on public.resources ("order");

-- If your project already has a profiles table, this adds an admin flag.
alter table public.profiles
	add column if not exists is_admin boolean not null default false;

create or replace function public.update_resources_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

drop trigger if exists resources_updated_at on public.resources;
create trigger resources_updated_at
before update on public.resources
for each row
execute function public.update_resources_updated_at();

alter table public.resources enable row level security;

drop policy if exists "Anyone can read visible resources" on public.resources;
create policy "Anyone can read visible resources"
on public.resources
for select
using (visible = true);

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.profiles p
		where p.id = auth.uid()
			and coalesce(p.is_admin, false) = true
	);
$$;

drop policy if exists "Admins can manage resources" on public.resources;
create policy "Admins can manage resources"
on public.resources
for all
using (auth.role() = 'authenticated' and public.is_admin_user())
with check (auth.role() = 'authenticated' and public.is_admin_user());

