create extension if not exists pgcrypto;

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table public.list_members (
  list_id uuid not null references public.lists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

create table public.movies (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer not null unique,
  title text not null,
  original_title text,
  poster_path text,
  release_date date,
  created_at timestamptz not null default now()
);

create table public.list_movies (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  added_by uuid references auth.users(id) on delete set null,
  watched boolean not null default false,
  added_at timestamptz not null default now(),
  constraint list_movies_list_id_movie_id_key unique (list_id, movie_id)
);

create index lists_owner_id_idx on public.lists(owner_id);
create index list_members_user_id_idx on public.list_members(user_id);
create index list_members_list_id_idx on public.list_members(list_id);
create index list_movies_list_id_idx on public.list_movies(list_id);
create index list_movies_movie_id_idx on public.list_movies(movie_id);
create index list_movies_list_id_watched_idx on public.list_movies(list_id, watched);

alter table public.lists enable row level security;
alter table public.list_members enable row level security;
alter table public.movies enable row level security;
alter table public.list_movies enable row level security;

create or replace function public.is_list_member(target_list_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.list_members
    where list_id = target_list_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_list_owner(target_list_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.lists
    where id = target_list_id
      and owner_id = auth.uid()
  );
$$;

create or replace function public.can_access_movie(target_movie_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.list_movies lm
    join public.list_members member on member.list_id = lm.list_id
    where lm.movie_id = target_movie_id
      and member.user_id = auth.uid()
  );
$$;

create or replace function public.join_list_by_invite(invite text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_list_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select id into target_list_id
  from public.lists
  where invite_code = invite;

  if target_list_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.list_members (list_id, user_id, role)
  values (target_list_id, auth.uid(), 'member')
  on conflict (list_id, user_id) do nothing;

  return target_list_id;
end;
$$;

create or replace function public.upsert_movie(
  input_tmdb_id integer,
  input_title text,
  input_original_title text,
  input_poster_path text,
  input_release_date text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_movie_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.movies (
    tmdb_id,
    title,
    original_title,
    poster_path,
    release_date
  )
  values (
    input_tmdb_id,
    input_title,
    input_original_title,
    input_poster_path,
    nullif(input_release_date, '')::date
  )
  on conflict (tmdb_id) do update set
    title = excluded.title,
    original_title = excluded.original_title,
    poster_path = excluded.poster_path,
    release_date = excluded.release_date
  returning id into target_movie_id;

  return target_movie_id;
end;
$$;

revoke all on function public.is_list_member(uuid) from public;
revoke all on function public.is_list_owner(uuid) from public;
revoke all on function public.can_access_movie(uuid) from public;
revoke all on function public.join_list_by_invite(text) from public;
revoke all on function public.upsert_movie(integer, text, text, text, text) from public;

grant execute on function public.is_list_member(uuid) to authenticated;
grant execute on function public.is_list_owner(uuid) to authenticated;
grant execute on function public.can_access_movie(uuid) to authenticated;
grant execute on function public.join_list_by_invite(text) to authenticated;
grant execute on function public.upsert_movie(integer, text, text, text, text) to authenticated;

create policy "Members can read lists"
on public.lists
for select
to authenticated
using (public.is_list_member(id));

create policy "Authenticated users can create owned lists"
on public.lists
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Owners can update lists"
on public.lists
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Owners can delete lists"
on public.lists
for delete
to authenticated
using (owner_id = auth.uid());

create policy "Members can read list members"
on public.list_members
for select
to authenticated
using (public.is_list_member(list_id));

create policy "Owners can insert owner memberships"
on public.list_members
for insert
to authenticated
with check (
  role = 'owner'
  and user_id = auth.uid()
  and public.is_list_owner(list_id)
);

create policy "Owners can update list memberships"
on public.list_members
for update
to authenticated
using (public.is_list_owner(list_id))
with check (public.is_list_owner(list_id));

create policy "Owners can delete list memberships"
on public.list_members
for delete
to authenticated
using (public.is_list_owner(list_id));

create policy "Members can read linked movie metadata"
on public.movies
for select
to authenticated
using (public.can_access_movie(id));

create policy "Authenticated users can insert movie metadata"
on public.movies
for insert
to authenticated
with check (auth.uid() is not null);

create policy "Members can read list movies"
on public.list_movies
for select
to authenticated
using (public.is_list_member(list_id));

create policy "Members can add list movies"
on public.list_movies
for insert
to authenticated
with check (public.is_list_member(list_id));

create policy "Members can update list movies"
on public.list_movies
for update
to authenticated
using (public.is_list_member(list_id))
with check (public.is_list_member(list_id));

create policy "Members can remove list movies"
on public.list_movies
for delete
to authenticated
using (public.is_list_member(list_id));
