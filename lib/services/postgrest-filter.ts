const POSTGREST_COLUMN_NAME = /^[a-z_][a-z0-9_]*$/i

export function escapePostgrestIlikePattern(value: string): string {
  return value.trim().replace(/[%_\\]/g, (match) => `\\${match}`)
}

function quotePostgrestFilterValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

/**
 * Builds one PostgREST `or` expression without letting user punctuation become
 * filter grammar. PostgREST requires quoted values when they contain commas,
 * parentheses, or other reserved characters.
 */
export function buildPostgrestIlikeAnyFilter(
  columns: readonly string[],
  value: string,
): string {
  if (columns.length === 0 || columns.some((column) => !POSTGREST_COLUMN_NAME.test(column))) {
    throw new Error('PostgREST ILIKE columns must be trusted identifiers')
  }

  const pattern = `%${escapePostgrestIlikePattern(value)}%`
  const quotedPattern = quotePostgrestFilterValue(pattern)
  return columns.map((column) => `${column}.ilike.${quotedPattern}`).join(',')
}
