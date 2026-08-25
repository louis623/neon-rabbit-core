-- Add the read-only Sparkle Finder catalog v2 contract. Catalog identity,
-- variant uniqueness, item numbers, and existing mutations remain unchanged.

CREATE INDEX IF NOT EXISTS idx_jewelry_designs_finder_catalog_order
  ON public.jewelry_designs (created_at DESC NULLS LAST, id DESC);

CREATE OR REPLACE FUNCTION public.sparkle_finder_catalog_filtered_v2(
  p_query text DEFAULT NULL,
  p_type_prefix text DEFAULT NULL,
  p_collection text DEFAULT NULL,
  p_material text DEFAULT NULL,
  p_main_stone text DEFAULT NULL,
  p_label text DEFAULT NULL,
  p_collection_year integer DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  item_number text,
  design_name text,
  collection_name text,
  collection_year integer,
  type_prefix text,
  material text,
  main_stone text,
  bp_msrp numeric,
  canonical_photo_url text,
  search_tags text[],
  created_at timestamptz,
  catalog_label text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO public
SET statement_timeout TO '5s'
AS $function$
  WITH base AS MATERIALIZED (
    SELECT
      d.id,
      d.item_number,
      d.design_name,
      c.name AS collection_name,
      c.collection_year,
      d.type_prefix::text AS type_prefix,
      d.material,
      d.main_stone,
      d.bp_msrp,
      d.canonical_photo_url,
      COALESCE(d.search_tags, ARRAY[]::text[]) AS search_tags,
      d.created_at,
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM unnest(COALESCE(d.search_tags, ARRAY[]::text[])) AS tag
          WHERE lower(btrim(tag)) = 'unicorn'
        ) THEN 'unicorn'
        WHEN EXISTS (
          SELECT 1
          FROM unnest(COALESCE(d.search_tags, ARRAY[]::text[])) AS tag
          WHERE lower(btrim(tag)) = 'diamond'
        ) THEN 'diamond'
        ELSE 'standard'
      END AS catalog_label,
      (
        NULLIF(btrim(p_query), '') IS NOT NULL
        AND (
          position(lower(btrim(p_query)) IN lower(d.item_number)) > 0
          OR position(lower(btrim(p_query)) IN lower(d.design_name)) > 0
          OR position(lower(btrim(p_query)) IN lower(COALESCE(d.material, ''))) > 0
          OR position(lower(btrim(p_query)) IN lower(COALESCE(d.main_stone, ''))) > 0
        )
      ) AS direct_match,
      (
        length(btrim(COALESCE(p_query, ''))) BETWEEN 2 AND 32
        AND EXISTS (
          SELECT 1
          FROM unnest(COALESCE(d.search_tags, ARRAY[]::text[])) AS tag
          WHERE lower(btrim(tag)) = lower(btrim(p_query))
        )
      ) AS tag_match,
      (
        NULLIF(btrim(p_query), '') IS NOT NULL
        AND (
          position(lower(btrim(p_query)) IN lower(COALESCE(c.name, ''))) > 0
          OR (
            btrim(p_query) ~ '^20[2-4][0-9]$'
            AND c.collection_year = btrim(p_query)::integer
          )
        )
      ) AS collection_match
    FROM public.jewelry_designs AS d
    LEFT JOIN public.collections AS c ON c.id = d.collection_id
    WHERE
      (p_type_prefix IS NULL OR d.type_prefix::text = p_type_prefix)
      AND (
        NULLIF(btrim(p_collection), '') IS NULL
        OR position(lower(btrim(p_collection)) IN lower(COALESCE(c.name, ''))) > 0
      )
      AND (
        NULLIF(btrim(p_material), '') IS NULL
        OR position(lower(btrim(p_material)) IN lower(COALESCE(d.material, ''))) > 0
      )
      AND (
        NULLIF(btrim(p_main_stone), '') IS NULL
        OR position(lower(btrim(p_main_stone)) IN lower(COALESCE(d.main_stone, ''))) > 0
      )
      AND (p_collection_year IS NULL OR c.collection_year = p_collection_year)
  ),
  labeled AS MATERIALIZED (
    SELECT *
    FROM base
    WHERE p_label IS NULL OR base.catalog_label = p_label
  ),
  search_mode AS (
    SELECT CASE
      WHEN NULLIF(btrim(p_query), '') IS NULL THEN 'all'
      WHEN EXISTS (SELECT 1 FROM labeled WHERE direct_match) THEN 'direct'
      WHEN EXISTS (SELECT 1 FROM labeled WHERE tag_match) THEN 'tag'
      ELSE 'collection'
    END AS mode
  )
  SELECT
    base.id,
    base.item_number,
    base.design_name,
    base.collection_name,
    base.collection_year,
    base.type_prefix,
    base.material,
    base.main_stone,
    base.bp_msrp,
    base.canonical_photo_url,
    base.search_tags,
    base.created_at,
    base.catalog_label
  FROM labeled AS base
  CROSS JOIN search_mode
  WHERE CASE search_mode.mode
      WHEN 'all' THEN true
      WHEN 'direct' THEN base.direct_match
      WHEN 'tag' THEN base.tag_match
      ELSE base.collection_match
    END;
$function$;

CREATE OR REPLACE FUNCTION public.list_sparkle_finder_catalog_v2(
  p_query text DEFAULT NULL,
  p_type_prefix text DEFAULT NULL,
  p_collection text DEFAULT NULL,
  p_material text DEFAULT NULL,
  p_main_stone text DEFAULT NULL,
  p_label text DEFAULT NULL,
  p_collection_year integer DEFAULT NULL,
  p_limit integer DEFAULT 24,
  p_cursor_created_at timestamptz DEFAULT NULL,
  p_cursor_design_id uuid DEFAULT NULL,
  p_cursor_created_at_is_null boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO public
SET statement_timeout TO '5s'
AS $function$
  WITH
  request_limit AS (
    SELECT LEAST(GREATEST(COALESCE(p_limit, 24), 1), 50)::bigint AS value
  ),
  filtered AS MATERIALIZED (
    SELECT *
    FROM public.sparkle_finder_catalog_filtered_v2(
      p_query,
      p_type_prefix,
      p_collection,
      p_material,
      p_main_stone,
      p_label,
      p_collection_year
    )
  ),
  page_rows AS MATERIALIZED (
    SELECT
      filtered.*,
      row_number() OVER (
        ORDER BY filtered.created_at DESC NULLS LAST, filtered.id DESC
      ) AS page_position
    FROM filtered
    CROSS JOIN request_limit
    WHERE
      p_cursor_design_id IS NULL
      OR CASE
        WHEN p_cursor_created_at_is_null THEN
          filtered.created_at IS NULL AND filtered.id < p_cursor_design_id
        ELSE
          filtered.created_at IS NULL
          OR filtered.created_at < p_cursor_created_at
          OR (
            filtered.created_at = p_cursor_created_at
            AND filtered.id < p_cursor_design_id
          )
      END
    ORDER BY filtered.created_at DESC NULLS LAST, filtered.id DESC
    LIMIT (SELECT value + 1 FROM request_limit)
  )
  SELECT jsonb_build_object(
    'items', COALESCE(
      (
        SELECT jsonb_agg(
          to_jsonb(page_rows) - 'page_position' - 'catalog_label'
          ORDER BY page_rows.page_position
        )
        FROM page_rows
        CROSS JOIN request_limit
        WHERE page_rows.page_position <= request_limit.value
      ),
      '[]'::jsonb
    ),
    'totalCount', (SELECT count(*) FROM filtered),
    'hasMore', (
      (SELECT count(*) FROM page_rows) > (SELECT value FROM request_limit)
    ),
    'nextPosition', (
      SELECT jsonb_build_object(
        'createdAt', page_rows.created_at,
        'designId', page_rows.id
      )
      FROM page_rows
      CROSS JOIN request_limit
      WHERE page_rows.page_position = request_limit.value
        AND EXISTS (
          SELECT 1
          FROM page_rows AS lookahead
          WHERE lookahead.page_position > request_limit.value
        )
      LIMIT 1
    )
  );
$function$;

CREATE OR REPLACE FUNCTION public.list_sparkle_finder_catalog_facets_v2(
  p_query text DEFAULT NULL,
  p_type_prefix text DEFAULT NULL,
  p_collection text DEFAULT NULL,
  p_material text DEFAULT NULL,
  p_main_stone text DEFAULT NULL,
  p_label text DEFAULT NULL,
  p_collection_year integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO public
SET statement_timeout TO '5s'
AS $function$
  WITH filtered AS MATERIALIZED (
    SELECT *
    FROM public.sparkle_finder_catalog_filtered_v2(
      p_query,
      p_type_prefix,
      p_collection,
      p_material,
      p_main_stone,
      p_label,
      p_collection_year
    )
  )
  SELECT jsonb_build_object(
    'collections', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('value', collection_name, 'count', facet_count)
        ORDER BY collection_name
      )
      FROM (
        SELECT collection_name, count(*) AS facet_count
        FROM filtered
        WHERE NULLIF(btrim(collection_name), '') IS NOT NULL
        GROUP BY collection_name
      ) AS collection_facets
    ), '[]'::jsonb),
    'materials', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('value', material, 'count', facet_count)
        ORDER BY material
      )
      FROM (
        SELECT material, count(*) AS facet_count
        FROM filtered
        WHERE NULLIF(btrim(material), '') IS NOT NULL
        GROUP BY material
      ) AS material_facets
    ), '[]'::jsonb),
    'stones', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('value', main_stone, 'count', facet_count)
        ORDER BY main_stone
      )
      FROM (
        SELECT main_stone, count(*) AS facet_count
        FROM filtered
        WHERE NULLIF(btrim(main_stone), '') IS NOT NULL
        GROUP BY main_stone
      ) AS stone_facets
    ), '[]'::jsonb),
    'types', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('value', jewelry_type, 'count', facet_count)
        ORDER BY jewelry_type
      )
      FROM (
        SELECT
          CASE type_prefix
            WHEN 'RG' THEN 'ring'
            WHEN 'NK' THEN 'necklace'
            WHEN 'ER' THEN 'earrings'
            WHEN 'ST' THEN 'stack'
            WHEN 'BR' THEN 'bracelet'
          END AS jewelry_type,
          count(*) AS facet_count
        FROM filtered
        GROUP BY type_prefix
      ) AS type_facets
      WHERE jewelry_type IS NOT NULL
    ), '[]'::jsonb),
    'labels', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('value', catalog_label, 'count', facet_count)
        ORDER BY catalog_label
      )
      FROM (
        SELECT catalog_label, count(*) AS facet_count
        FROM filtered
        GROUP BY catalog_label
      ) AS label_facets
    ), '[]'::jsonb),
    'years', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('value', collection_year::text, 'count', facet_count)
        ORDER BY collection_year
      )
      FROM (
        SELECT collection_year, count(*) AS facet_count
        FROM filtered
        WHERE collection_year IS NOT NULL
        GROUP BY collection_year
      ) AS year_facets
    ), '[]'::jsonb)
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_sparkle_finder_catalog_batch_v2(
  p_design_ids uuid[]
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO public
SET statement_timeout TO '5s'
AS $function$
  SELECT jsonb_build_object(
    'items', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'item_number', d.item_number,
          'design_name', d.design_name,
          'collection_name', c.name,
          'collection_year', c.collection_year,
          'type_prefix', d.type_prefix::text,
          'material', d.material,
          'main_stone', d.main_stone,
          'bp_msrp', d.bp_msrp,
          'canonical_photo_url', d.canonical_photo_url,
          'search_tags', COALESCE(d.search_tags, ARRAY[]::text[]),
          'created_at', d.created_at
        )
        ORDER BY d.id
      ),
      '[]'::jsonb
    )
  )
  FROM public.jewelry_designs AS d
  LEFT JOIN public.collections AS c ON c.id = d.collection_id
  WHERE d.id = ANY(COALESCE(p_design_ids, ARRAY[]::uuid[]));
$function$;

REVOKE ALL ON FUNCTION public.sparkle_finder_catalog_filtered_v2(
  text, text, text, text, text, text, integer
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.list_sparkle_finder_catalog_v2(
  text, text, text, text, text, text, integer, integer,
  timestamptz, uuid, boolean
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.list_sparkle_finder_catalog_facets_v2(
  text, text, text, text, text, text, integer
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_sparkle_finder_catalog_batch_v2(uuid[])
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.sparkle_finder_catalog_filtered_v2(
  text, text, text, text, text, text, integer
) TO service_role;
GRANT EXECUTE ON FUNCTION public.list_sparkle_finder_catalog_v2(
  text, text, text, text, text, text, integer, integer,
  timestamptz, uuid, boolean
) TO service_role;
GRANT EXECUTE ON FUNCTION public.list_sparkle_finder_catalog_facets_v2(
  text, text, text, text, text, text, integer
) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_sparkle_finder_catalog_batch_v2(uuid[])
  TO service_role;

NOTIFY pgrst, 'reload schema';
