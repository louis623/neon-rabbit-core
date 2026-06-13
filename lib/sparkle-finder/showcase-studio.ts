export type ShowcaseStudioIntakeStatus =
  | "needs_label"
  | "needs_confirmation"
  | "needs_jewelry_photo"
  | "photo_rejected"
  | "accepted"
  | "publish_queued"
  | "published"
  | "rejected"
  | "unavailable";

export type ShowcaseStudioLabelDetails = {
  bpLabel?: string;
  collectionName?: string;
  collectionYear?: number;
  designName?: string;
  itemNumber?: string;
  jewelryType?: string;
  mainStone?: string;
  material?: string;
};

export type ShowcaseStudioIntakeRequest = {
  finderSubmissionId: string;
  originalLabelImageDataUrl: string;
  jewelryFrontImageDataUrl?: string;
  labelDetails?: ShowcaseStudioLabelDetails;
  customerNote?: string;
};

export type ShowcaseStudioConfig = {
  apiUrl: string;
  bearerToken: string;
};

export type ShowcaseStudioResult =
  | {
      ok: true;
      status: Exclude<ShowcaseStudioIntakeStatus, "needs_label" | "photo_rejected" | "unavailable">;
      message: string;
      suiteDesignId?: string;
      catalogDraft?: ShowcaseStudioLabelDetails;
    }
  | {
      ok: false;
      status: "needs_label" | "photo_rejected" | "unavailable" | "rejected";
      message: string;
      photoFeedback?: string[];
      lightBoxHelpHref?: string;
    };

type ShowcaseStudioFetch = (
  input: string,
  init: {
    body: string;
    cache: "no-store";
    headers: Record<string, string>;
    method: "POST";
  },
) => Promise<Response>;

type SubmitShowcaseStudioIntakeOptions = {
  config?: ShowcaseStudioConfig;
  fetcher?: ShowcaseStudioFetch;
};

const lightBoxHelpHref = "/shop#collector-photo";
const missingLabelMessage = "Original Bomb Party label photo is required before Nic-Nac can review a missing piece.";

export function getShowcaseStudioConfig(env: NodeJS.ProcessEnv = process.env): ShowcaseStudioConfig {
  return {
    apiUrl: String(env.SPARKLE_SUITE_FINDER_INTAKE_API_URL ?? "").trim(),
    bearerToken: String(env.SPARKLE_FINDER_TO_SUITE_INTAKE_TOKEN ?? "").trim(),
  };
}

export async function submitShowcaseStudioIntake(
  request: ShowcaseStudioIntakeRequest,
  options: SubmitShowcaseStudioIntakeOptions = {},
): Promise<ShowcaseStudioResult> {
  if (!request.originalLabelImageDataUrl.trim()) {
    return {
      ok: false,
      status: "needs_label",
      message: missingLabelMessage,
    };
  }

  const config = options.config ?? getShowcaseStudioConfig();

  if (!config.apiUrl || !config.bearerToken) {
    return {
      ok: false,
      status: "unavailable",
      message: "Showcase Studio publishing is not connected yet.",
    };
  }

  const fetcher = options.fetcher ?? fetch;
  let response: Response;

  try {
    response = await fetcher(config.apiUrl, {
      body: JSON.stringify(createSuiteIntakePayload(request)),
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${config.bearerToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch {
    return {
      ok: false,
      status: "unavailable",
      message: "Showcase Studio could not reach the master database intake right now.",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: "unavailable",
      message: "Showcase Studio could not publish this review request right now.",
    };
  }

  return mapSuiteIntakeResponse(await safeReadJson(response));
}

function createSuiteIntakePayload(request: ShowcaseStudioIntakeRequest) {
  return {
    sourceProduct: "sparkle_finder",
    finderSubmissionId: cleanText(request.finderSubmissionId, 120),
    originalLabelImageDataUrl: request.originalLabelImageDataUrl,
    jewelryFrontImageDataUrl: request.jewelryFrontImageDataUrl ?? "",
    labelDetails: cleanLabelDetails(request.labelDetails),
    customerNote: cleanText(request.customerNote, 500),
  };
}

function mapSuiteIntakeResponse(body: unknown): ShowcaseStudioResult {
  const record = readRecord(body);
  const status = readStatus(record.status);
  const message = cleanText(readString(record.message), 240) || defaultMessageForStatus(status);

  if (status === "photo_rejected") {
    return {
      ok: false,
      status,
      message,
      photoFeedback: readStringArray(record.photoFeedback),
      lightBoxHelpHref,
    };
  }

  if (status === "rejected") {
    return {
      ok: false,
      status,
      message,
    };
  }

  return {
    ok: true,
    status,
    message,
    suiteDesignId: cleanText(readString(record.suiteDesignId), 120) || undefined,
    catalogDraft: cleanLabelDetails(readRecord(record.catalogDraft)),
  };
}

function readStatus(value: unknown): Exclude<ShowcaseStudioIntakeStatus, "needs_label" | "unavailable"> {
  if (
    value === "needs_confirmation" ||
    value === "needs_jewelry_photo" ||
    value === "photo_rejected" ||
    value === "accepted" ||
    value === "publish_queued" ||
    value === "published" ||
    value === "rejected"
  ) {
    return value;
  }

  return "needs_confirmation";
}

async function safeReadJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function cleanLabelDetails(details: unknown): ShowcaseStudioLabelDetails {
  const record = readRecord(details);
  const collectionYear = Number(record.collectionYear);

  return {
    bpLabel: cleanText(readString(record.bpLabel), 40) || undefined,
    collectionName: cleanText(readString(record.collectionName), 120) || undefined,
    collectionYear: Number.isFinite(collectionYear) ? collectionYear : undefined,
    designName: cleanText(readString(record.designName), 160) || undefined,
    itemNumber: cleanText(readString(record.itemNumber), 80) || undefined,
    jewelryType: cleanText(readString(record.jewelryType), 40) || undefined,
    mainStone: cleanText(readString(record.mainStone), 120) || undefined,
    material: cleanText(readString(record.material), 120) || undefined,
  };
}

function defaultMessageForStatus(status: ShowcaseStudioResult["status"]): string {
  if (status === "photo_rejected") {
    return "Nic-Nac needs a cleaner light-box jewelry photo before this can move forward.";
  }

  if (status === "rejected") {
    return "Nic-Nac could not confirm this missing piece from the submitted details.";
  }

  if (status === "published") {
    return "This piece has been added to the shared master jewelry database.";
  }

  return "Nic-Nac received this missing-piece review request.";
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.flatMap((item) => {
        const text = cleanText(readString(item), 180);

        return text ? [text] : [];
      })
    : [];
}

function cleanText(value: string | undefined, maxLength: number): string {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}
