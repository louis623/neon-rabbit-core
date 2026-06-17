-- Birthday collection identity needs the year in the collection name itself.
-- Keep collection_year as structured metadata, but make Trade Board/catalog
-- display names unambiguous: "July Birthday 2026", "April Birthday 2027", etc.

WITH birthday_sources AS (
  SELECT
    id AS source_id,
    trim(
      regexp_replace(
        regexp_replace(
          regexp_replace(name, '[[:space:]]+collection[[:space:]]*$', '', 'i'),
          '\m20[2-4][0-9]\M',
          '',
          'g'
        ),
        '[[:space:]]+',
        ' ',
        'g'
      )
    ) || ' ' || collection_year::text AS target_name
  FROM public.collections
  WHERE name ILIKE '%Birthday%'
    AND collection_year IS NOT NULL
    AND NOT (name ~ ('\m' || collection_year::text || '\M'))
),
merge_targets AS (
  SELECT
    birthday_sources.source_id,
    target.id AS target_id
  FROM birthday_sources
  JOIN public.collections AS target
    ON lower(target.name) = lower(birthday_sources.target_name)
   AND target.id <> birthday_sources.source_id
)
UPDATE public.jewelry_designs AS designs
SET collection_id = merge_targets.target_id,
    updated_at = now()
FROM merge_targets
WHERE designs.collection_id = merge_targets.source_id;

WITH birthday_sources AS (
  SELECT
    id AS source_id,
    trim(
      regexp_replace(
        regexp_replace(
          regexp_replace(name, '[[:space:]]+collection[[:space:]]*$', '', 'i'),
          '\m20[2-4][0-9]\M',
          '',
          'g'
        ),
        '[[:space:]]+',
        ' ',
        'g'
      )
    ) || ' ' || collection_year::text AS target_name
  FROM public.collections
  WHERE name ILIKE '%Birthday%'
    AND collection_year IS NOT NULL
    AND NOT (name ~ ('\m' || collection_year::text || '\M'))
),
merge_targets AS (
  SELECT
    birthday_sources.source_id,
    target.id AS target_id
  FROM birthday_sources
  JOIN public.collections AS target
    ON lower(target.name) = lower(birthday_sources.target_name)
   AND target.id <> birthday_sources.source_id
)
DELETE FROM public.collections AS collections
USING merge_targets
WHERE collections.id = merge_targets.source_id
  AND NOT EXISTS (
    SELECT 1
    FROM public.jewelry_designs AS designs
    WHERE designs.collection_id = collections.id
  );

WITH birthday_sources AS (
  SELECT
    id AS source_id,
    trim(
      regexp_replace(
        regexp_replace(
          regexp_replace(name, '[[:space:]]+collection[[:space:]]*$', '', 'i'),
          '\m20[2-4][0-9]\M',
          '',
          'g'
        ),
        '[[:space:]]+',
        ' ',
        'g'
      )
    ) || ' ' || collection_year::text AS target_name
  FROM public.collections
  WHERE name ILIKE '%Birthday%'
    AND collection_year IS NOT NULL
    AND NOT (name ~ ('\m' || collection_year::text || '\M'))
)
UPDATE public.collections AS collections
SET name = birthday_sources.target_name
FROM birthday_sources
WHERE collections.id = birthday_sources.source_id
  AND NOT EXISTS (
    SELECT 1
    FROM public.collections AS existing
    WHERE lower(existing.name) = lower(birthday_sources.target_name)
      AND existing.id <> collections.id
  );

UPDATE public.trade_board_intake_sessions
SET collection_name =
  trim(
    regexp_replace(
      regexp_replace(
        regexp_replace(collection_name, '[[:space:]]+collection[[:space:]]*$', '', 'i'),
        '\m20[2-4][0-9]\M',
        '',
        'g'
      ),
      '[[:space:]]+',
      ' ',
      'g'
    )
  ) || ' ' || collection_year::text,
  updated_at = now()
WHERE collection_name ILIKE '%Birthday%'
  AND collection_year IS NOT NULL
  AND NOT (collection_name ~ ('\m' || collection_year::text || '\M'));
