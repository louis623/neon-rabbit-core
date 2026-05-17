-- Rename assistant-owned persistence tables to Nic-Nac names.
-- Historical migrations keep their original filenames; runtime code moves to
-- the new table names in this migration.

DO $$
BEGIN
  IF to_regclass('public.thumper_conversations') IS NOT NULL
     AND to_regclass('public.nic_nac_conversations') IS NULL THEN
    ALTER TABLE public.thumper_conversations RENAME TO nic_nac_conversations;
  END IF;

  IF to_regclass('public.thumper_incidents') IS NOT NULL
     AND to_regclass('public.nic_nac_incidents') IS NULL THEN
    ALTER TABLE public.thumper_incidents RENAME TO nic_nac_incidents;
  END IF;
END $$;

ALTER INDEX IF EXISTS idx_thumper_conv_rep RENAME TO idx_nic_nac_conv_rep;
ALTER INDEX IF EXISTS idx_thumper_conv_conv RENAME TO idx_nic_nac_conv_conv;
ALTER INDEX IF EXISTS idx_thumper_incidents_severity_created
  RENAME TO idx_nic_nac_incidents_severity_created;
ALTER INDEX IF EXISTS idx_thumper_incidents_rep_created
  RENAME TO idx_nic_nac_incidents_rep_created;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'nic_nac_conversations'
      AND policyname = 'thumper_conv_own_data'
  ) THEN
    ALTER POLICY thumper_conv_own_data ON public.nic_nac_conversations
      RENAME TO nic_nac_conv_own_data;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'nic_nac_conversations'
      AND policyname = 'thumper_conv_admin_full_access'
  ) THEN
    ALTER POLICY thumper_conv_admin_full_access ON public.nic_nac_conversations
      RENAME TO nic_nac_conv_admin_full_access;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'nic_nac_incidents'
      AND policyname = 'thumper_incidents_service_role_only'
  ) THEN
    ALTER POLICY thumper_incidents_service_role_only ON public.nic_nac_incidents
      RENAME TO nic_nac_incidents_service_role_only;
  END IF;
END $$;
