-- Louis approved ordinary acting-as-rep Workspace capabilities. Billing,
-- payment, authentication, account security, and ownership remain blocked by
-- the gateway route inventory and are intentionally absent here.

create or replace function public.operator_support_capabilities_are_valid(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(value) = 'array'
    and jsonb_array_length(value) between 1 and 18
    and (
      select count(*) = count(distinct capability)
      from jsonb_array_elements_text(value) as capabilities(capability)
    )
    and not exists (
      select 1
      from jsonb_array_elements_text(value) as capabilities(capability)
      where capability not in (
        'workspace.view', 'workspace.manage',
        'site.view', 'site.manage',
        'inventory.view', 'inventory.manage',
        'calendar.view', 'calendar.manage',
        'customers.view', 'customers.manage',
        'team.view', 'team.manage',
        'messages.view', 'messages.manage',
        'communications.manage', 'nic_nac.use',
        'live_queue.view', 'live_queue.manage'
      )
    );
$$;

alter table public.operator_support_audit_events
  drop constraint if exists operator_support_audit_events_capability_check,
  add constraint operator_support_audit_events_capability_check
  check (capability is null or capability in (
    'workspace.view', 'workspace.manage',
    'site.view', 'site.manage',
    'inventory.view', 'inventory.manage',
    'calendar.view', 'calendar.manage',
    'customers.view', 'customers.manage',
    'team.view', 'team.manage',
    'messages.view', 'messages.manage',
    'communications.manage', 'nic_nac.use',
    'live_queue.view', 'live_queue.manage'
  ));
