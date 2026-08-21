import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { get } from "node:http";
import { createServer } from "node:net";
import { join, resolve } from "node:path";

const port = Number(process.env.SPARKLE_FINDER_SMOKE_PORT ?? "4310");
const baseUrl = `http://127.0.0.1:${port}`;
const screenshotDir = resolve("verification/sparkle-finder");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const useShell = process.platform === "win32";
const smokeEnv = {
  SPARKLE_FINDER_ENABLE_PREVIEW_AUTH: "true",
};

async function main() {
  mkdirSync(screenshotDir, { recursive: true });

  rmSync(resolve(".next/dev"), { force: true, recursive: true });
  runCommand(npmCommand, ["run", "build"], smokeEnv);
  await assertPortIsFree(port);

  const server = startServer();
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

  try {
    await waitForServer(server, baseUrl);
    runCommand(
      npxCommand,
      [
        "playwright",
        "test",
        "tests/smoke/sparkle-finder-home.spec.ts",
        "tests/smoke/sparkle-finder-showcase.spec.ts",
        "tests/smoke/sparkle-finder-social-favorites.spec.ts",
        "--reporter=line",
      ],
      {
        SPARKLE_FINDER_BASE_URL: baseUrl,
        SPARKLE_FINDER_SCREENSHOT_DIR: screenshotDir,
        SPARKLE_FINDER_SMOKE_EXPECT_LIVE_REPS: "true",
      },
    );

    console.log(`Sparkle Finder smoke passed at ${baseUrl}`);
    console.log(`Screenshots written to ${join(screenshotDir, "sparkle-finder-home-desktop.png")}`);
    console.log(`Screenshots written to ${join(screenshotDir, "sparkle-finder-home-mobile.png")}`);
    console.log(`Screenshots written to ${join(screenshotDir, "sparkle-showcase-public-desktop.png")}`);
    console.log(`Screenshots written to ${join(screenshotDir, "sparkle-social-favorites-desktop.png")}`);
  } finally {
    process.removeListener("exit", cleanup);
    cleanup();
  }
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

function startServer() {
  const server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", "127.0.0.1"],
    {
      env: {
        ...process.env,
        ...smokeEnv,
      },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  server.stdout.on("data", (chunk) => process.stdout.write(chunk));
  server.stderr.on("data", (chunk) => process.stderr.write(chunk));

  return server;
}

function assertPortIsFree(portToCheck: number) {
  return new Promise<void>((resolvePort, rejectPort) => {
    const server = createServer();

    server.once("error", (error: NodeJS.ErrnoException) => {
      rejectPort(
        new Error(
          `Port ${portToCheck} is already in use. Stop the existing local server or set SPARKLE_FINDER_SMOKE_PORT.`,
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
        `Local server exited before smoke tests could run: exit=${server.exitCode ?? "null"} signal=${
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
