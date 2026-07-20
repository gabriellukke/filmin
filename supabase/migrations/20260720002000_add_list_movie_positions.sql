alter table public.list_movies
add column if not exists position integer;

with ranked as (
  select
    id,
    row_number() over (
      partition by list_id
      order by added_at asc, id asc
    ) - 1 as next_position
  from public.list_movies
)
update public.list_movies target
set position = ranked.next_position
from ranked
where target.id = ranked.id
  and target.position is null;

alter table public.list_movies
alter column position set default 0;

alter table public.list_movies
alter column position set not null;

create index if not exists list_movies_list_id_position_idx
on public.list_movies(list_id, position);

create or replace function public.reorder_list_movies(
  input_list_id uuid,
  input_list_movie_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item_id uuid;
  item_position integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_list_member(input_list_id) then
    raise exception 'Not a member of this list';
  end if;

  if exists (
    select 1
    from unnest(input_list_movie_ids) as requested(id)
    left join public.list_movies lm
      on lm.id = requested.id
      and lm.list_id = input_list_id
    where lm.id is null
  ) then
    raise exception 'Invalid movie order';
  end if;

  foreach item_id in array input_list_movie_ids loop
    update public.list_movies
    set position = item_position
    where id = item_id
      and list_id = input_list_id;

    item_position := item_position + 1;
  end loop;
end;
$$;

revoke all on function public.reorder_list_movies(uuid, uuid[]) from public;
grant execute on function public.reorder_list_movies(uuid, uuid[]) to authenticated;

notify pgrst, 'reload schema';
