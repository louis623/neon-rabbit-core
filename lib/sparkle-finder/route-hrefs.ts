export function getLocalRepBoardHref(boardUrl: string): string {
  const listingSlug = getLastUrlSegment(boardUrl);

  return listingSlug ? `/rep-boards?listing=${encodeURIComponent(listingSlug)}` : "/rep-boards";
}

export function getLocalRepHref(siteUrl: string): string {
  const repSlug = getLastUrlSegment(siteUrl);

  return repSlug ? `/rep-boards?rep=${encodeURIComponent(repSlug)}` : "/rep-boards";
}

function getLastUrlSegment(value: string): string | undefined {
  return value.split("/").filter(Boolean).at(-1);
}
