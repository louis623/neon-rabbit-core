import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = join(scriptDir, "..");

const requiredFiles = [
  "src/App.tsx",
  "src/data.ts",
  "src/state.ts",
  "src/types.ts",
  "src/components/Dashboard.tsx",
  "src/components/NicNac.tsx",
  "src/components/Questions.tsx",
  "src/components/Resources.tsx",
  "src/components/StepDetail.tsx",
  "src/styles.css",
];

const requiredPhrases = [
  { file: "src/App.tsx", phrase: "Britt with Bling" },
  { file: "src/data.ts", phrase: "Questions for Brittany" },
  { file: "src/data.ts", phrase: "Sparkle Suite" },
  {
    file: "src/components/Questions.tsx",
    phrase: "Sparkle Suite team workspace",
  },
];

const failures = [];

for (const file of requiredFiles) {
  const path = join(appRoot, file);

  if (!existsSync(path)) {
    failures.push(`Missing required file: ${file}`);
  }
}

for (const { file, phrase } of requiredPhrases) {
  const path = join(appRoot, file);

  if (!existsSync(path)) {
    failures.push(`Cannot check phrase "${phrase}" because ${file} is missing.`);
    continue;
  }

  const content = readFileSync(path, "utf8");

  if (!content.includes(phrase)) {
    failures.push(`Missing expected phrase in ${file}: "${phrase}"`);
  }
}

if (failures.length > 0) {
  console.error("Rep onboarding static smoke failed:");

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log("Rep onboarding static smoke passed.");
