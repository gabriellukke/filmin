do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'list_movies'
      and constraint_name = 'list_movies_added_by_profiles_fkey'
  ) then
    alter table public.list_movies
    add constraint list_movies_added_by_profiles_fkey
    foreign key (added_by)
    references public.profiles(id)
    on delete set null;
  end if;
end;
$$;

notify pgrst, 'reload schema';
