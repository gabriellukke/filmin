create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.profiles (id, email, display_name, created_at, updated_at)
select
  id,
  email,
  coalesce(
    raw_user_meta_data ->> 'full_name',
    raw_user_meta_data ->> 'name',
    split_part(email, '@', 1)
  ),
  created_at,
  now()
from auth.users
on conflict (id) do nothing;

alter table public.list_members
add constraint list_members_user_id_profiles_fkey
foreign key (user_id)
references public.profiles(id)
on delete cascade;

alter table public.list_movies
add constraint list_movies_added_by_profiles_fkey
foreign key (added_by)
references public.profiles(id)
on delete set null;

create index profiles_email_idx on public.profiles(email);

alter table public.profiles enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name);

  return new;
end;
$$;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

create or replace function public.shares_list_with_profile(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.list_members viewer
    join public.list_members target on target.list_id = viewer.list_id
    where viewer.user_id = auth.uid()
      and target.user_id = target_user_id
  );
$$;

revoke all on function public.shares_list_with_profile(uuid) from public;
grant execute on function public.shares_list_with_profile(uuid) to authenticated;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "List members can read member profiles"
on public.profiles
for select
to authenticated
using (public.shares_list_with_profile(id));
