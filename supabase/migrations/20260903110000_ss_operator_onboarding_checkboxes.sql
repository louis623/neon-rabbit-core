-- Simplify the operator onboarding ledger to the requested checkbox-only UI.
alter table public.operator_onboarding_checklist_items
  add column if not exists is_completed boolean not null default false;

update public.operator_onboarding_checklist_items
set is_completed = (status = 'complete')
where is_completed = false and status = 'complete';

alter table public.operator_onboarding_checklist_items
  drop column if exists status,
  drop column if exists evidence_summary,
  drop column if exists updated_by_rep_id,
  drop column if exists completed_at;
