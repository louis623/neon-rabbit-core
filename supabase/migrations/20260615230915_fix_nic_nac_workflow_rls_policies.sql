drop policy if exists trade_board_intake_sessions_own_data
  on public.trade_board_intake_sessions;
drop policy if exists trade_board_intake_sessions_admin_full_access
  on public.trade_board_intake_sessions;
drop policy if exists trade_board_intake_photos_own_data
  on public.trade_board_intake_photos;
drop policy if exists trade_board_intake_photos_admin_full_access
  on public.trade_board_intake_photos;

revoke all on table public.trade_board_intake_sessions from anon;
revoke all on table public.trade_board_intake_photos from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.trade_board_intake_sessions from authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.trade_board_intake_photos from authenticated;

grant select on table public.trade_board_intake_sessions to authenticated;
grant select on table public.trade_board_intake_photos to authenticated;
grant select, insert, update, delete on table public.trade_board_intake_sessions to service_role;
grant select, insert, update, delete on table public.trade_board_intake_photos to service_role;

create policy trade_board_intake_sessions_own_data
  on public.trade_board_intake_sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.reps
      where public.reps.id = trade_board_intake_sessions.rep_id
        and public.reps.auth_user_id = (select auth.uid())
    )
  );

create policy trade_board_intake_sessions_admin_full_access
  on public.trade_board_intake_sessions
  for all
  to service_role
  using (true)
  with check (true);

create policy trade_board_intake_photos_own_data
  on public.trade_board_intake_photos
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.reps
      where public.reps.id = trade_board_intake_photos.rep_id
        and public.reps.auth_user_id = (select auth.uid())
    )
  );

create policy trade_board_intake_photos_admin_full_access
  on public.trade_board_intake_photos
  for all
  to service_role
  using (true)
  with check (true);

notify pgrst, 'reload schema';
