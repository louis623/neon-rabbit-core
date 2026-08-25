export const FREE_FAVORITE_REP_LIMIT = 5;
export const FAVORITE_REP_NOTE_MAX_LENGTH = 500;

export function canFavoriteRep(input: {
  userId: string | null;
  currentFavoriteCount: number;
  hasSilverAccess: boolean;
  isAlreadyFavorited?: boolean;
}): { allowed: boolean; alreadyFavorited?: true; reason?: "sign_in_required" | "free_limit_reached" } {
  if (!input.userId) {
    return { allowed: false, reason: "sign_in_required" };
  }

  if (input.isAlreadyFavorited) {
    return { allowed: true, alreadyFavorited: true };
  }

  if (!input.hasSilverAccess && input.currentFavoriteCount >= FREE_FAVORITE_REP_LIMIT) {
    return { allowed: false, reason: "free_limit_reached" };
  }

  return { allowed: true };
}

export function canEditFavoriteRepNotes(input: {
  userId: string | null;
  hasSilverAccess: boolean;
  favoriteOwnerUserId: string;
}): boolean {
  return Boolean(input.userId && input.hasSilverAccess && input.userId === input.favoriteOwnerUserId);
}

export function normalizeFavoriteRepNote(value: unknown): string {
  return String(value ?? "")
    .trim()
    .slice(0, FAVORITE_REP_NOTE_MAX_LENGTH);
}

export function normalizeRepId(value: unknown): string {
  return String(value ?? "").trim().slice(0, 200);
}
