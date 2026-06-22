import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { get } from "node:http";
import { createServer } from "node:net";
import { pathToFileURL } from "node:url";

type SmokeAuthMode = "free" | "silver";

export type FinderNicNacSmokeConfig = {
  baseUrl: string;
  port: number;
  startServer: boolean;
  expectModelConfigured: boolean;
  authMode: SmokeAuthMode;
  prompt: string;
  cookieHeader?: string;
  internalSmokeToken?: string;
};

export type FinderNicNacSmokeResult = {
  ok: boolean;
  status:
    | "blocked_missing_model"
    | "stream_ok"
    | "unexpected_missing_model"
    | "unexpected_status"
    | "hard_fail_phrase";
  detail: string;
};

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const useShell = process.platform === "win32";
const hardFailPhrases = [
  "i can't actually add listings",
  "log into your workspace and add it manually",
  "unboxed",
  "plain background",
  "packaging is too prominent",
];

export function parseFinderNicNacSmokeConfig(
  env: NodeJS.ProcessEnv,
  args: string[] = process.argv.slice(2),
): FinderNicNacSmokeConfig {
  const port = Number(env.SPARKLE_FINDER_NIC_NAC_SMOKE_PORT ?? env.SPARKLE_FINDER_SMOKE_PORT ?? "4310");
  const explicitBaseUrl = env.SPARKLE_FINDER_NIC_NAC_SMOKE_BASE_URL?.trim();
  const baseUrl = (explicitBaseUrl || `http://127.0.0.1:${port}`).replace(/\/+$/, "");
  const expectModelConfigured = args.includes("--expect-missing-model")
    ? false
    : parseBoolean(env.SPARKLE_FINDER_NIC_NAC_EXPECT_MODEL_CONFIGURED, true);

  return {
    baseUrl,
    port,
    startServer: parseBoolean(env.SPARKLE_FINDER_NIC_NAC_SMOKE_START_SERVER, !explicitBaseUrl),
    expectModelConfigured,
    authMode: env.SPARKLE_FINDER_NIC_NAC_AUTH_MODE === "free" ? "free" : "silver",
    prompt: env.SPARKLE_FINDER_NIC_NAC_SMOKE_PROMPT?.trim() || "Show my favorite reps.",
    ...(env.SPARKLE_FINDER_NIC_NAC_COOKIE?.trim()
      ? { cookieHeader: env.SPARKLE_FINDER_NIC_NAC_COOKIE.trim() }
      : {}),
    ...(env.SPARKLE_FINDER_INTERNAL_SMOKE_TOKEN?.trim()
      ? { internalSmokeToken: env.SPARKLE_FINDER_INTERNAL_SMOKE_TOKEN.trim() }
      : {}),
  };
}

export function buildFinderNicNacSmokeBody(prompt: string) {
  return {
    messages: [
      {
        id: "finder-nic-nac-smoke-1",
        role: "user",
        parts: [{ type: "text", text: prompt }],
      },
    ],
  };
}

export async function evaluateFinderNicNacSmokeResponse(
  response: Response,
  input: Pick<FinderNicNacSmokeConfig, "expectModelConfigured">,
): Promise<FinderNicNacSmokeResult> {
  const bodyText = await response.text();
  const body = safeJson(bodyText);

  if (response.status === 503 && isRecord(body) && body.error === "model_not_configured") {
    return input.expectModelConfigured
      ? {
          ok: false,
          status: "unexpected_missing_model",
          detail: "Finder Nic-Nac returned model_not_configured while this smoke expected a configured model.",
        }
      : {
          ok: true,
          status: "blocked_missing_model",
          detail: "Finder Nic-Nac returned model_not_configured as expected.",
        };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: "unexpected_status",
      detail: `Finder Nic-Nac returned HTTP ${response.status}: ${bodyText.slice(0, 240)}`,
    };
  }

  const searchableText = createHardFailSearchText(bodyText);
  const matchedHardFail = hardFailPhrases.find((phrase) => searchableText.includes(phrase));

  if (matchedHardFail) {
    return {
      ok: false,
      status: "hard_fail_phrase",
      detail: `Finder Nic-Nac stream contained hard-fail phrase: ${matchedHardFail}`,
    };
  }

  return {
    ok: true,
    status: "stream_ok",
    detail: "Finder Nic-Nac returned a successful stream with no hard-fail phrases.",
  };
}

export function extractCookieHeader(headers: Headers): string {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const cookies = typeof getSetCookie === "function"
    ? getSetCookie.call(headers)
    : splitSetCookieHeader(headers.get("set-cookie") ?? "");

  return cookies
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function main() {
  const config = parseFinderNicNacSmokeConfig(process.env);
  const serverEnv = createServerEnv(config);
  let server: ChildProcess | null = null;
  let reviewerSession: ReviewerSmokeSession | null = null;

  if (config.startServer) {
    runCommand(npmCommand, ["run", "build"], serverEnv);
    await assertPortIsFree(config.port);
    server = startServer(config, serverEnv);
    registerCleanup(server);
    await waitForServer(server, config.baseUrl);
  }

  try {
    const authCookie = await getSmokeAuthCookie(config);
    reviewerSession = authCookie.reviewerSession;
    const response = await fetch(`${config.baseUrl}/api/finder/nic-nac`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: authCookie.cookieHeader,
      },
      body: JSON.stringify(buildFinderNicNacSmokeBody(config.prompt)),
      cache: "no-store",
    });
    const result = await evaluateFinderNicNacSmokeResponse(response, config);

    if (!result.ok) {
      throw new Error(result.detail);
    }

    console.log(`Finder Nic-Nac smoke ${result.status}: ${result.detail}`);
    console.log(`BASE_URL=${config.baseUrl}`);
    console.log(`PROMPT=${config.prompt}`);
  } finally {
    if (reviewerSession) {
      await cleanupReviewerSmokeSession(config, reviewerSession);
    }
    if (server) {
      stopServer(server);
    }
  }
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

function createServerEnv(config: FinderNicNacSmokeConfig): Record<string, string> {
  return {
    SPARKLE_FINDER_ENABLE_PREVIEW_AUTH: "true",
    ...(config.expectModelConfigured ? {} : { OPENAI_API_KEY: "" }),
  };
}

function runCommand(command: string, args: string[], env: Record<string, string> = {}) {
  const result = spawnSync(useShell ? `${command} ${args.join(" ")}` : command, useShell ? [] : args, {
    env: { ...process.env, ...env },
    shell: useShell,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}${
        result.error ? `: ${result.error.message}` : ""
      }`,
    );
  }
}

function startServer(config: FinderNicNacSmokeConfig, env: Record<string, string>) {
  const server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", String(config.port), "-H", "127.0.0.1"],
    {
      env: {
        ...process.env,
        ...env,
      },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  server.stdout.on("data", (chunk) => process.stdout.write(chunk));
  server.stderr.on("data", (chunk) => process.stderr.write(chunk));

  return server;
}

function registerCleanup(server: ChildProcess) {
  const cleanup = () => stopServer(server);

  process.once("exit", cleanup);
  process.once("SIGINT", () => {
    cleanup();
    process.exit(130);
  });
  process.once("SIGTERM", () => {
    cleanup();
    process.exit(143);
  });
}

function assertPortIsFree(portToCheck: number) {
  return new Promise<void>((resolvePort, rejectPort) => {
    const server = createServer();

    server.once("error", (error: NodeJS.ErrnoException) => {
      rejectPort(
        new Error(
          `Port ${portToCheck} is already in use. Stop the existing local server or set SPARKLE_FINDER_NIC_NAC_SMOKE_PORT.`,
          { cause: error },
        ),
      );
    });

    server.once("listening", () => {
      server.close(() => resolvePort());
    });

    server.listen(portToCheck, "127.0.0.1");
  });
}

async function waitForServer(server: ChildProcess, url: string) {
  const deadline = Date.now() + 30_000;
  let lastError: unknown;

  while (Date.now() < deadline) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(
        `Local server exited before Nic-Nac smoke could run: exit=${server.exitCode ?? "null"} signal=${
          server.signalCode ?? "null"
        }`,
      );
    }

    try {
      await request(url);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolveTimeout) => setTimeout(resolveTimeout, 500));
    }
  }

  throw new Error(`Timed out waiting for ${url}: ${String(lastError)}`);
}

function request(url: string) {
  return new Promise<void>((resolveRequest, rejectRequest) => {
    const requestHandle = get(url, (response) => {
      response.resume();

      if (response.statusCode && response.statusCode < 500) {
        resolveRequest();
      } else {
        rejectRequest(new Error(`Unexpected status ${response.statusCode}`));
      }
    });

    requestHandle.on("error", rejectRequest);
    requestHandle.setTimeout(5_000, () => {
      requestHandle.destroy(new Error("Request timed out"));
    });
  });
}

async function getPreviewAuthCookie(config: FinderNicNacSmokeConfig): Promise<string> {
  const response = await fetch(`${config.baseUrl}/auth/preview/${config.authMode}`, {
    redirect: "manual",
    cache: "no-store",
  });
  const cookieHeader = extractCookieHeader(response.headers);

  if (!cookieHeader) {
    throw new Error(
      `Could not acquire Sparkle Finder preview auth cookie from ${config.baseUrl}. Set SPARKLE_FINDER_NIC_NAC_COOKIE for deployed smoke if preview auth is disabled.`,
    );
  }

  return cookieHeader;
}

type SmokeAuthCookieResult = {
  cookieHeader: string;
  reviewerSession: ReviewerSmokeSession | null;
};

type ReviewerSmokeSession = {
  smokeId: string;
  userId: string;
};

async function getSmokeAuthCookie(config: FinderNicNacSmokeConfig): Promise<SmokeAuthCookieResult> {
  if (config.cookieHeader) {
    return { cookieHeader: config.cookieHeader, reviewerSession: null };
  }

  if (!config.startServer && config.internalSmokeToken) {
    const reviewerSession = await createReviewerSmokeSession(config);

    return {
      cookieHeader: reviewerSession.cookieHeader,
      reviewerSession,
    };
  }

  return {
    cookieHeader: await getPreviewAuthCookie(config),
    reviewerSession: null,
  };
}

async function createReviewerSmokeSession(
  config: FinderNicNacSmokeConfig,
): Promise<ReviewerSmokeSession & { cookieHeader: string }> {
  const response = await fetch(`${config.baseUrl}/api/internal/finder/reviewer-smoke-session`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.internalSmokeToken}`,
    },
    cache: "no-store",
  });
  const cookieHeader = extractCookieHeader(response.headers);
  const bodyText = await response.text();
  const body = safeJson(bodyText);

  if (!response.ok || !isRecord(body) || body.ok !== true) {
    throw new Error(
      `Could not create Finder reviewer smoke session: HTTP ${response.status}: ${bodyText.slice(0, 240)}`,
    );
  }

  if (typeof body.userId !== "string" || typeof body.smokeId !== "string") {
    throw new Error("Finder reviewer smoke session did not return cleanup identifiers.");
  }

  if (!cookieHeader) {
    throw new Error("Finder reviewer smoke session did not return Supabase auth cookies.");
  }

  return {
    cookieHeader,
    smokeId: body.smokeId,
    userId: body.userId,
  };
}

async function cleanupReviewerSmokeSession(
  config: FinderNicNacSmokeConfig,
  session: ReviewerSmokeSession,
) {
  if (!config.internalSmokeToken) {
    return;
  }

  const response = await fetch(`${config.baseUrl}/api/internal/finder/reviewer-smoke-session`, {
    method: "DELETE",
    headers: {
      authorization: `Bearer ${config.internalSmokeToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      smokeId: session.smokeId,
      userId: session.userId,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const bodyText = await response.text();
    console.warn(
      `Finder reviewer smoke cleanup returned HTTP ${response.status}: ${bodyText.slice(0, 240)}`,
    );
  }
}

function stopServer(server: ChildProcess) {
  if (server.killed) {
    return;
  }

  if (process.platform === "win32" && server.pid) {
    spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], {
      shell: false,
      stdio: "ignore",
    });
    return;
  }

  server.kill();
}

function splitSetCookieHeader(value: string): string[] {
  if (!value) {
    return [];
  }

  return value.split(/,(?=\s*[^;,]+=)/).map((cookie) => cookie.trim());
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function createHardFailSearchText(bodyText: string): string {
  const extractedStrings: string[] = [];

  for (const line of bodyText.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    const jsonText = trimmedLine.startsWith("data:")
      ? trimmedLine.slice("data:".length).trim()
      : trimmedLine;

    if (!jsonText || jsonText === "[DONE]") {
      continue;
    }

    collectJsonStrings(safeJson(jsonText), extractedStrings);
  }

  return [
    bodyText,
    extractedStrings.join(""),
    extractedStrings.join(" "),
  ].join("\n").toLowerCase();
}

function collectJsonStrings(value: unknown, output: string[]) {
  if (typeof value === "string") {
    output.push(value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectJsonStrings(item, output));
    return;
  }

  if (isRecord(value)) {
    const preferredTextKeys = ["text", "delta", "content", "message"];

    for (const key of preferredTextKeys) {
      collectJsonStrings(value[key], output);
    }

    Object.entries(value)
      .filter(([key]) => !preferredTextKeys.includes(key) && key !== "type")
      .forEach(([, item]) => collectJsonStrings(item, output));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
