grant usage on schema public to service_role;

grant select, insert, update, delete
on public.sparkle_finder_profiles
to service_role;

grant select, insert, update, delete
on public.sparkle_finder_memberships
to service_role;

notify pgrst, 'reload schema';
