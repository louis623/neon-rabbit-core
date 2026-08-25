import type { LiveShow, RepBoardListing, RepSummary } from "./types";

export type RepDirectoryStatus = "live_now" | "live_today" | "upcoming" | "no_show";
export type RepDirectoryView = "all" | "live_now" | "live_today" | "upcoming" | "favorites";

export type RepDirectoryCard = {
  repId: string;
  displayName: string;
  businessName: string;
  avatarUrl: string | null;
  state: string | null;
  customerSiteUrl: string | null;
  repBoardUrl: string | null;
  isFavorited: boolean;
  favoriteCount: number;
  status: RepDirectoryStatus;
  statusLabel: string;
  nextShow: {
    id: string;
    title: string;
    startsAt: string;
    status: LiveShow["status"];
    customerShowUrl: string | null;
  } | null;
};

export type BuildRepDirectoryCardsInput = {
  reps: RepSummary[];
  liveShows: LiveShow[];
  boardListings?: RepBoardListing[];
  favoriteRepIds?: Iterable<string>;
  favoriteCounts?: ReadonlyMap<string, number>;
  now?: Date;
  query?: string;
  view?: RepDirectoryView;
};

const statusRank: Record<RepDirectoryStatus, number> = {
  live_now: 0,
  live_today: 1,
  upcoming: 2,
  no_show: 3,
};

export function buildRepDirectoryCards({
  reps,
  liveShows,
  boardListings = [],
  favoriteRepIds = [],
  favoriteCounts = new Map(),
  now = new Date(),
  query = "",
  view = "all",
}: BuildRepDirectoryCardsInput): RepDirectoryCard[] {
  const showsById = new Map(liveShows.map((show) => [show.id, show]));
  const boardsByRepId = new Map<string, string>();
  for (const listing of boardListings) {
    if (listing.status === "available" && !boardsByRepId.has(listing.repId)) {
      boardsByRepId.set(listing.repId, listing.boardUrl);
    }
  }
  const favoriteIds = new Set(favoriteRepIds);
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return reps
    .map((rep) => {
      const nextShow = showsById.get(rep.nextLiveShowId);
      const boardUrl = boardsByRepId.get(rep.id) ?? null;
      const status = deriveRepDirectoryStatus(nextShow, now);
      const visibleNextShow = status === "no_show" ? undefined : nextShow;
      const favoriteCount = Math.max(0, favoriteCounts.get(rep.id) ?? 0);

      return {
        repId: rep.id,
        displayName: rep.displayName,
        businessName: rep.businessName,
        avatarUrl: rep.avatarUrl.trim() || null,
        state: rep.state.trim() || null,
        customerSiteUrl: rep.siteUrl.trim() || null,
        repBoardUrl: boardUrl,
        isFavorited: favoriteIds.has(rep.id),
        favoriteCount,
        status,
        statusLabel: getRepDirectoryStatusLabel(status),
        nextShow: visibleNextShow
          ? {
              id: visibleNextShow.id,
              title: visibleNextShow.title,
              startsAt: visibleNextShow.startsAt,
              status: visibleNextShow.status,
              customerShowUrl: visibleNextShow.showUrl.trim() || null,
            }
          : null,
      } satisfies RepDirectoryCard;
    })
    .filter((card) => matchesRepDirectoryQuery(card, normalizedQuery) && matchesRepDirectoryView(card, view))
    .sort(compareRepDirectoryCards);
}

function matchesRepDirectoryView(card: RepDirectoryCard, view: RepDirectoryView): boolean {
  switch (view) {
    case "all":
      return true;
    case "favorites":
      return card.isFavorited;
    case "live_now":
    case "live_today":
    case "upcoming":
      return card.status === view;
  }
}

export function getRepDirectoryStatusLabel(status: RepDirectoryStatus): string {
  switch (status) {
    case "live_now":
      return "Live now";
    case "live_today":
      return "Live today";
    case "upcoming":
      return "Upcoming";
    case "no_show":
      return "No show scheduled";
  }
}

function deriveRepDirectoryStatus(show: LiveShow | undefined, now: Date): RepDirectoryStatus {
  if (!show || show.status === "completed") {
    return "no_show";
  }

  const startsAt = Date.parse(show.startsAt);
  if (Number.isNaN(startsAt)) {
    return "no_show";
  }

  const durationMilliseconds = Math.max(1, show.durationMinutes) * 60_000;
  if (startsAt + durationMilliseconds <= now.getTime()) {
    return "no_show";
  }

  if (show.status === "live" && startsAt <= now.getTime()) {
    return "live_now";
  }

  if (startsAt < now.getTime()) {
    return "no_show";
  }

  return isSameCustomerDate(show.startsAt, now) ? "live_today" : "upcoming";
}

function matchesRepDirectoryQuery(card: RepDirectoryCard, normalizedQuery: string): boolean {
  if (!normalizedQuery) {
    return true;
  }

  return [card.displayName, card.businessName, card.state ?? ""].join(" ").toLocaleLowerCase().includes(normalizedQuery);
}

function compareRepDirectoryCards(left: RepDirectoryCard, right: RepDirectoryCard): number {
  const favoriteDelta = right.favoriteCount - left.favoriteCount;

  if (favoriteDelta !== 0) {
    return favoriteDelta;
  }

  const rankDelta = statusRank[left.status] - statusRank[right.status];

  if (rankDelta !== 0) {
    return rankDelta;
  }

  const leftTime = getShowTime(left);
  const rightTime = getShowTime(right);

  if (leftTime !== null && rightTime !== null && leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  if (leftTime !== null && rightTime === null) {
    return -1;
  }

  if (leftTime === null && rightTime !== null) {
    return 1;
  }

  return left.displayName.localeCompare(right.displayName);
}

function getShowTime(card: RepDirectoryCard): number | null {
  if (!card.nextShow) {
    return null;
  }

  const time = Date.parse(card.nextShow.startsAt);

  return Number.isNaN(time) ? null : time;
}

function isSameCustomerDate(value: string, now: Date): boolean {
  const showDate = new Date(value);

  if (Number.isNaN(showDate.getTime())) {
    return false;
  }

  return getDateKey(showDate) === getDateKey(now);
}

function getDateKey(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/New_York",
    year: "numeric",
  }).format(value);
}
