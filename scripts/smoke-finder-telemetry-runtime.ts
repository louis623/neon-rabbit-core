import { pathToFileURL } from "node:url";

type EnvRecord = Record<string, string | undefined>;

type FinderTelemetrySmokeConfig = {
  baseUrl: string;
  token?: string;
};

const defaultBaseUrl = "https://sparkle-finder-dev.vercel.app";

function parseConfig(env: EnvRecord): FinderTelemetrySmokeConfig {
  return {
    baseUrl: cleanUrl(env.SPARKLE_FINDER_TELEMETRY_SMOKE_BASE_URL || defaultBaseUrl),
    token: clean(env.SPARKLE_FINDER_INTERNAL_SMOKE_TOKEN),
  };
}

async function main() {
  const config = parseConfig(process.env);

  if (!config.token) {
    throw new Error("Missing SPARKLE_FINDER_INTERNAL_SMOKE_TOKEN.");
  }

  const response = await fetch(`${config.baseUrl}/api/internal/finder/nic-nac-telemetry-smoke`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
  });
  const body = await safeJson(response);

  if (!response.ok || body?.ok !== true || !hasSuccessfulCleanup(body)) {
    throw new Error(`Finder telemetry smoke failed: ${JSON.stringify(redactSmokeBody(body))}`);
  }

  console.log("Finder Nic-Nac telemetry runtime smoke passed.");
  console.log(`BASE_URL=${config.baseUrl}`);
  console.log(`ROW_COUNTS=${JSON.stringify(body.rowCounts)}`);
  console.log(`CHECKS=${JSON.stringify(body.checks)}`);
  console.log(`CLEANUP=${JSON.stringify(body.cleanup)}`);
}

async function safeJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const value = await response.json();

    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function redactSmokeBody(body: Record<string, unknown> | null) {
  if (!body) {
    return null;
  }

  const { smokeId: _smokeId, ...rest } = body;

  return rest;
}

function hasSuccessfulCleanup(body: Record<string, unknown> | null): boolean {
  const cleanup = body?.cleanup;

  return Boolean(
    cleanup
    && typeof cleanup === "object"
    && !Array.isArray(cleanup)
    && "ok" in cleanup
    && cleanup.ok === true,
  );
}

function cleanUrl(value: string) {
  return clean(value).replace(/\/+$/, "");
}

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
