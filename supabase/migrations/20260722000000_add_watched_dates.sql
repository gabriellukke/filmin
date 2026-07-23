alter table public.list_movies
add column watched_at date;

update public.list_movies
set watched_at = added_at::date
where watched = true
  and watched_at is null;
