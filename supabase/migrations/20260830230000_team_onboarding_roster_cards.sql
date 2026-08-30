ALTER TABLE public.team_onboarding_participants
  ADD COLUMN IF NOT EXISTS join_team_member_id UUID
  REFERENCES public.join_team_members(id) ON DELETE SET NULL;

WITH unambiguous_member_matches AS (
  SELECT
    participant.id AS participant_id,
    MIN(member.id::text)::uuid AS member_id
  FROM public.team_onboarding_participants AS participant
  JOIN public.join_team_members AS member
    ON member.rep_id = participant.owner_rep_id
   AND lower(btrim(member.display_name)) = lower(btrim(participant.display_name))
  WHERE participant.join_team_member_id IS NULL
    AND participant.status <> 'archived'
  GROUP BY participant.id
  HAVING COUNT(*) = 1
),
unique_participant_matches AS (
  SELECT
    MIN(participant_id::text)::uuid AS participant_id,
    member_id
  FROM unambiguous_member_matches
  GROUP BY member_id
  HAVING COUNT(*) = 1
)
UPDATE public.team_onboarding_participants AS participant
SET join_team_member_id = matched.member_id,
    updated_at = now()
FROM unique_participant_matches AS matched
WHERE participant.id = matched.participant_id;

CREATE INDEX IF NOT EXISTS idx_team_onboarding_participants_roster_member
  ON public.team_onboarding_participants(owner_rep_id, join_team_member_id)
  WHERE join_team_member_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_team_onboarding_participants_active_roster_member
  ON public.team_onboarding_participants(owner_rep_id, join_team_member_id)
  WHERE join_team_member_id IS NOT NULL AND status <> 'archived';
