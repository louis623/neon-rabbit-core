# Britt with Bling Start Strong Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a separate clickable prototype for Brittany's new-rep Start Strong checklist with seeded official Bomb Party resources, demo team guidance, local progress tracking, question capture, and a floating Nic-Nac helper.

**Architecture:** Create a new Vite React app in `C:\Users\louis\britt-with-bling-start-strong`. Keep the skeleton data-file driven, persist local prototype state in `localStorage`, and keep Nic-Nac as a canned-response helper that can later be replaced by a real retrieval-backed agent.

**Tech Stack:** React, TypeScript, Vite, CSS modules or plain CSS, local JSON-like TypeScript seed data, browser `localStorage`.

---

## File Structure

Create a new repo outside `neon-rabbit-core`:

- `C:\Users\louis\britt-with-bling-start-strong\package.json` - scripts and dependencies.
- `C:\Users\louis\britt-with-bling-start-strong\vite.config.ts` - Vite React config.
- `C:\Users\louis\britt-with-bling-start-strong\index.html` - Vite entry document.
- `C:\Users\louis\britt-with-bling-start-strong\src\main.tsx` - React mount.
- `C:\Users\louis\britt-with-bling-start-strong\src\App.tsx` - app composition and state owner.
- `C:\Users\louis\britt-with-bling-start-strong\src\data.ts` - seed resources, checklist steps, and canned Nic-Nac answers.
- `C:\Users\louis\britt-with-bling-start-strong\src\types.ts` - shared types.
- `C:\Users\louis\britt-with-bling-start-strong\src\state.ts` - localStorage helpers and derived progress functions.
- `C:\Users\louis\britt-with-bling-start-strong\src\components\Dashboard.tsx` - dashboard path cards and next step.
- `C:\Users\louis\britt-with-bling-start-strong\src\components\StepDetail.tsx` - selected step content and actions.
- `C:\Users\louis\britt-with-bling-start-strong\src\components\Resources.tsx` - official/team resource list.
- `C:\Users\louis\britt-with-bling-start-strong\src\components\Questions.tsx` - visible questions for Brittany.
- `C:\Users\louis\britt-with-bling-start-strong\src\components\NicNac.tsx` - floating helper and canned chat routing.
- `C:\Users\louis\britt-with-bling-start-strong\src\styles.css` - full visual system and responsive layout.
- `C:\Users\louis\britt-with-bling-start-strong\README.md` - pilot purpose, deploy/domain notes, source disclaimer.

## Seed Content Requirements

Use these official resources in `src\data.ts`:

```ts
export const resources: Resource[] = [
  {
    id: 'bp-enrollment-guide',
    title: 'Bomb Party New Rep Enrollment Guide',
    description: 'Official guide for enrolling as a Party Rep.',
    url: 'https://bombpartyassets.blob.core.windows.net/exigoresourcelibraryassets/Enrolling%20as%20a%20Party%20Rep-2024.pdf',
    sourceType: 'official',
  },
  {
    id: 'bpu-enrollment-guide',
    title: 'Bomb Party University Login Guide',
    description: 'Official BPU enrollment and Teachable login walkthrough.',
    url: 'https://bombpartyassets.blob.core.windows.net/exigoresourcelibraryassets/How%20to%20Guide%20Your%20Downline%20Through%20the%20BPU%20Enrollment%20Process%2011.1.24.pdf',
    sourceType: 'official',
  },
  {
    id: 'bp-income-disclosure',
    title: 'Bomb Party Income Disclosure Statement',
    description: 'Official income disclosure for compliance-aware business basics.',
    url: 'https://bombpartyassets.blob.core.windows.net/exigoresourcelibraryassets/Rep%20Use%20Documents/Bomb%20Party_Income%20Disclosure%20Statement_2025%20%281%29.pdf',
    sourceType: 'official',
  },
  {
    id: 'bp-shipping-policy',
    title: 'Bomb Party Shipping Policy',
    description: 'Official shipping policy resource.',
    url: 'https://bombpartysupport.zendesk.com/hc/en-us/articles/33220290467732-Shipping-Policy',
    sourceType: 'official',
  },
  {
    id: 'bp-return-policy',
    title: 'Bomb Party Return Policy',
    description: 'Official return and reveal issue policy resource.',
    url: 'https://help.bombparty.com/hc/en-us/articles/33194356359444-Return-Policy',
    sourceType: 'official',
  },
  {
    id: 'ftc-mlm-guidance',
    title: 'FTC MLM Guidance',
    description: 'Plain compliance backstop for avoiding income and lifestyle claims.',
    url: 'https://www.ftc.gov/business-guidance/resources/business-guidance-concerning-multi-level-marketing',
    sourceType: 'official',
  },
  {
    id: 'sample-live-show-note',
    title: 'Sample Brittany Note: First Live Prep',
    description: 'Demo-only guidance until Brittany approves or replaces it.',
    url: '',
    sourceType: 'team',
  },
];
```

## Task 1: Create The Vite Skeleton

**Files:**

- Create: `C:\Users\louis\britt-with-bling-start-strong\package.json`
- Create: `C:\Users\louis\britt-with-bling-start-strong\index.html`
- Create: `C:\Users\louis\britt-with-bling-start-strong\src\main.tsx`
- Create: `C:\Users\louis\britt-with-bling-start-strong\src\App.tsx`
- Create: `C:\Users\louis\britt-with-bling-start-strong\src\styles.css`

- [ ] **Step 1: Create the project directory**

Run:

```powershell
New-Item -ItemType Directory -Force C:\Users\louis\britt-with-bling-start-strong\src | Out-Null
```

Expected: directory exists.

- [ ] **Step 2: Add `package.json`**

Create `package.json`:

```json
{
  "name": "britt-with-bling-start-strong",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "vite build",
    "preview": "vite preview --host 127.0.0.1"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "vite": "^7.0.0",
    "typescript": "^5.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

- [ ] **Step 3: Add Vite entry files**

Create `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Britt's Team Start Strong</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src\main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 4: Add a temporary app shell**

Create `src\App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <section className="panel">
        <p className="brand">Britt's Team Start Strong</p>
        <h1>Welcome, Sarah</h1>
        <p>Start here. One step at a time.</p>
      </section>
    </main>
  );
}
```

Create `src\styles.css`:

```css
:root {
  font-family: Arial, Helvetica, sans-serif;
  color: #1f2937;
  background: #f8fbff;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input,
textarea {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 40px;
}

.panel {
  max-width: 960px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 32px;
}

.brand {
  font-weight: 700;
  color: #334155;
}
```

- [ ] **Step 5: Install dependencies**

Run:

```powershell
npm install
```

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 6: Build**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 7: Commit**

Run:

```powershell
git init
git add .
git commit -m "chore: scaffold start strong pilot"
```

Expected: initial repo commit succeeds.

## Task 2: Add Types, Seed Data, And Local State

**Files:**

- Create: `C:\Users\louis\britt-with-bling-start-strong\src\types.ts`
- Create: `C:\Users\louis\britt-with-bling-start-strong\src\data.ts`
- Create: `C:\Users\louis\britt-with-bling-start-strong\src\state.ts`

- [ ] **Step 1: Add shared types**

Create `src\types.ts`:

```ts
export type ResourceSourceType = 'official' | 'team';

export type StepStatus = 'not-started' | 'done' | 'needs-help';

export type Resource = {
  id: string;
  title: string;
  description: string;
  url: string;
  sourceType: ResourceSourceType;
};

export type ChecklistGroup =
  | 'Get Set Up'
  | 'Learn the Back Office'
  | 'Get Supplies Ready'
  | 'Prepare for First Live'
  | 'Ship and Follow Up'
  | 'Questions for Brittany';

export type ChecklistStep = {
  id: string;
  group: ChecklistGroup;
  title: string;
  whatToDo: string;
  whyItMatters: string;
  resourceIds: string[];
  brittanyNote: string;
};

export type RepQuestion = {
  id: string;
  stepId: string | null;
  text: string;
  status: 'open' | 'answered';
  source: 'rep' | 'nic-nac';
};

export type NicNacAnswer = {
  id: string;
  triggers: string[];
  response: string;
  resourceIds: string[];
  shouldEscalate: boolean;
};

export type AppState = {
  selectedStepId: string;
  stepStatuses: Record<string, StepStatus>;
  questions: RepQuestion[];
};
```

- [ ] **Step 2: Add seed data**

Create `src\data.ts` using the resources from the Seed Content Requirements section and these checklist steps:

```ts
import type { ChecklistGroup, ChecklistStep, NicNacAnswer, Resource } from './types';

export const groups: ChecklistGroup[] = [
  'Get Set Up',
  'Learn the Back Office',
  'Get Supplies Ready',
  'Prepare for First Live',
  'Ship and Follow Up',
  'Questions for Brittany',
];

export const resources: Resource[] = [
  {
    id: 'bp-enrollment-guide',
    title: 'Bomb Party New Rep Enrollment Guide',
    description: 'Official guide for enrolling as a Party Rep.',
    url: 'https://bombpartyassets.blob.core.windows.net/exigoresourcelibraryassets/Enrolling%20as%20a%20Party%20Rep-2024.pdf',
    sourceType: 'official',
  },
  {
    id: 'bpu-enrollment-guide',
    title: 'Bomb Party University Login Guide',
    description: 'Official BPU enrollment and Teachable login walkthrough.',
    url: 'https://bombpartyassets.blob.core.windows.net/exigoresourcelibraryassets/How%20to%20Guide%20Your%20Downline%20Through%20the%20BPU%20Enrollment%20Process%2011.1.24.pdf',
    sourceType: 'official',
  },
  {
    id: 'bp-income-disclosure',
    title: 'Bomb Party Income Disclosure Statement',
    description: 'Official income disclosure for compliance-aware business basics.',
    url: 'https://bombpartyassets.blob.core.windows.net/exigoresourcelibraryassets/Rep%20Use%20Documents/Bomb%20Party_Income%20Disclosure%20Statement_2025%20%281%29.pdf',
    sourceType: 'official',
  },
  {
    id: 'bp-shipping-policy',
    title: 'Bomb Party Shipping Policy',
    description: 'Official shipping policy resource.',
    url: 'https://bombpartysupport.zendesk.com/hc/en-us/articles/33220290467732-Shipping-Policy',
    sourceType: 'official',
  },
  {
    id: 'bp-return-policy',
    title: 'Bomb Party Return Policy',
    description: 'Official return and reveal issue policy resource.',
    url: 'https://help.bombparty.com/hc/en-us/articles/33194356359444-Return-Policy',
    sourceType: 'official',
  },
  {
    id: 'ftc-mlm-guidance',
    title: 'FTC MLM Guidance',
    description: 'Plain compliance backstop for avoiding income and lifestyle claims.',
    url: 'https://www.ftc.gov/business-guidance/resources/business-guidance-concerning-multi-level-marketing',
    sourceType: 'official',
  },
  {
    id: 'sample-live-show-note',
    title: 'Sample Brittany Note: First Live Prep',
    description: 'Demo-only guidance until Brittany approves or replaces it.',
    url: '',
    sourceType: 'team',
  },
];

export const steps: ChecklistStep[] = [
  {
    id: 'bpu-login',
    group: 'Get Set Up',
    title: 'Log into Bomb Party University',
    whatToDo: 'Open the BPU email from Bomb Party, sign in through Teachable, and open your first training.',
    whyItMatters: 'BPU is where Bomb Party keeps official training. This tool helps you keep track, but BPU is still the official source.',
    resourceIds: ['bpu-enrollment-guide'],
    brittanyNote: 'Sample Brittany note: Do this before worrying about your first live. It answers basics you will need later.',
  },
  {
    id: 'enrollment-check',
    group: 'Get Set Up',
    title: 'Confirm your enrollment is complete',
    whatToDo: 'Make sure your rep account, store name, starter pack, and required agreement steps are complete.',
    whyItMatters: 'You need the official setup finished before you can focus on shows and customers.',
    resourceIds: ['bp-enrollment-guide'],
    brittanyNote: 'Sample Brittany note: If anything looks weird in enrollment, ask before clicking around for an hour.',
  },
  {
    id: 'business-basics',
    group: 'Learn the Back Office',
    title: 'Understand the money basics',
    whatToDo: 'Review the income disclosure and write down any questions about costs, commissions, or business expenses.',
    whyItMatters: 'This is a business. You should understand costs and avoid anyone making promises about guaranteed income.',
    resourceIds: ['bp-income-disclosure', 'ftc-mlm-guidance'],
    brittanyNote: 'Sample Brittany note: Do not overbuy inventory just because you are excited. Ask me before making a big spend.',
  },
  {
    id: 'dashboard-tour',
    group: 'Learn the Back Office',
    title: 'Find the important places in your rep dashboard',
    whatToDo: 'Find where orders, customer details, inventory, support, billing, and BPU links live in your Bomb Party back office.',
    whyItMatters: 'Most early confusion comes from not knowing where to click.',
    resourceIds: [],
    brittanyNote: 'Sample Brittany note: We will replace this with screenshots or a quick walkthrough after Brittany confirms the current dashboard.',
  },
  {
    id: 'supplies-ready',
    group: 'Get Supplies Ready',
    title: 'Gather your first-live supplies',
    whatToDo: 'Set aside your fizz setup, phone or camera, lighting, labels or packaging supplies, and a clean packing area.',
    whyItMatters: 'A calm setup makes your first live feel much easier.',
    resourceIds: ['sample-live-show-note'],
    brittanyNote: 'Sample Brittany note: Keep it simple. Good lighting and a steady phone matter more than a fancy setup.',
  },
  {
    id: 'first-live-run',
    group: 'Prepare for First Live',
    title: 'Practice your first live flow',
    whatToDo: 'Practice your greeting, how you explain ordering, how you reveal, and what you say when the room is quiet.',
    whyItMatters: 'Practicing the flow helps you avoid freezing when people are watching.',
    resourceIds: ['sample-live-show-note'],
    brittanyNote: 'Sample Brittany note: Quiet rooms happen. Keep talking, explain what you are doing, and do not panic.',
  },
  {
    id: 'shipping-basics',
    group: 'Ship and Follow Up',
    title: 'Review shipping and return basics',
    whatToDo: 'Open the official shipping and return resources. Save the links so you know where to check later.',
    whyItMatters: 'Customers will ask shipping and reveal issue questions. Use official resources instead of guessing.',
    resourceIds: ['bp-shipping-policy', 'bp-return-policy'],
    brittanyNote: 'Sample Brittany note: When policy details matter, check the official page before answering a customer.',
  },
];

export const nicNacAnswers: NicNacAnswer[] = [
  {
    id: 'bpu',
    triggers: ['bpu', 'university', 'teachable', 'login'],
    response: 'BPU is Bomb Party University. Start with the official login guide, then come back here and mark the step done.',
    resourceIds: ['bpu-enrollment-guide'],
    shouldEscalate: false,
  },
  {
    id: 'shipping',
    triggers: ['shipping', 'ship', 'tracking', 'label'],
    response: 'For shipping questions, start with the official Bomb Party shipping policy. If your question is about a specific customer order, save it for Brittany or Bomb Party support.',
    resourceIds: ['bp-shipping-policy'],
    shouldEscalate: false,
  },
  {
    id: 'returns',
    triggers: ['return', 'damaged', 'defective', 'replace', 'replacement'],
    response: 'For returns or reveal issues, use the official return policy. Do not guess on policy details.',
    resourceIds: ['bp-return-policy'],
    shouldEscalate: false,
  },
  {
    id: 'money',
    triggers: ['income', 'money', 'profit', 'commission', 'tax', 'taxes', 'guarantee'],
    response: 'Money questions need careful answers. Review the official income disclosure, and I saved this as a question for Brittany if you need personal guidance.',
    resourceIds: ['bp-income-disclosure', 'ftc-mlm-guidance'],
    shouldEscalate: true,
  },
  {
    id: 'sparkle-suite',
    triggers: ['website', 'live queue', 'customers', 'trade board', 'sparkle suite'],
    response: 'Sparkle Suite can help reps with a public site, customer resources, live queue support, and future tools once the basics are in place. For now, finish your Start Strong setup first.',
    resourceIds: [],
    shouldEscalate: false,
  },
];
```

- [ ] **Step 3: Add local state helpers**

Create `src\state.ts`:

```ts
import { steps } from './data';
import type { AppState, RepQuestion, StepStatus } from './types';

const STORAGE_KEY = 'bwb-start-strong-state-v1';

export function createInitialState(): AppState {
  return {
    selectedStepId: steps[0].id,
    stepStatuses: Object.fromEntries(steps.map((step) => [step.id, 'not-started' as StepStatus])),
    questions: [],
  };
}

export function loadState(): AppState {
  const fallback = createInitialState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<AppState>;

    return {
      selectedStepId: parsed.selectedStepId ?? fallback.selectedStepId,
      stepStatuses: { ...fallback.stepStatuses, ...(parsed.stepStatuses ?? {}) },
      questions: parsed.questions ?? [],
    };
  } catch {
    return fallback;
  }
}

export function saveState(state: AppState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getProgress(stepStatuses: Record<string, StepStatus>) {
  const done = steps.filter((step) => stepStatuses[step.id] === 'done').length;
  return { done, total: steps.length };
}

export function makeQuestion(text: string, stepId: string | null, source: RepQuestion['source']): RepQuestion {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    stepId,
    text,
    status: 'open',
    source,
  };
}
```

- [ ] **Step 4: Build**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src\types.ts src\data.ts src\state.ts
git commit -m "feat: add start strong seed data"
```

Expected: commit succeeds.

## Task 3: Build The Clickable Dashboard And Step Detail

**Files:**

- Modify: `C:\Users\louis\britt-with-bling-start-strong\src\App.tsx`
- Create: `C:\Users\louis\britt-with-bling-start-strong\src\components\Dashboard.tsx`
- Create: `C:\Users\louis\britt-with-bling-start-strong\src\components\StepDetail.tsx`
- Modify: `C:\Users\louis\britt-with-bling-start-strong\src\styles.css`

- [ ] **Step 1: Add dashboard component**

Create `src\components\Dashboard.tsx`:

```tsx
import { groups, steps } from '../data';
import { getProgress } from '../state';
import type { StepStatus } from '../types';

type DashboardProps = {
  selectedStepId: string;
  stepStatuses: Record<string, StepStatus>;
  onSelectStep: (stepId: string) => void;
};

export function Dashboard({ selectedStepId, stepStatuses, onSelectStep }: DashboardProps) {
  const progress = getProgress(stepStatuses);
  const nextStep = steps.find((step) => stepStatuses[step.id] !== 'done') ?? steps[0];

  return (
    <section className="dashboard">
      <div className="hero-card">
        <div>
          <h1>Welcome, Sarah</h1>
          <p>You're getting ready for your first Bomb Party shows.</p>
          <p>Start here. One step at a time.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => onSelectStep(nextStep.id)}>
              Continue next step
            </button>
            <button className="secondary-button" onClick={() => onSelectStep(selectedStepId)}>
              I need help
            </button>
          </div>
        </div>
        <div className="progress-box">
          <span className="eyebrow">Progress</span>
          <strong>{progress.done} of {progress.total} done</strong>
          <div className="progress-track">
            <div style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
          <p>Next: {nextStep.title}</p>
        </div>
      </div>

      <h2>Your Start Strong Path</h2>
      <div className="path-grid">
        {groups.map((group, index) => {
          const groupSteps = steps.filter((step) => step.group === group);
          const doneCount = groupSteps.filter((step) => stepStatuses[step.id] === 'done').length;
          const firstStep = groupSteps[0];
          const isSelected = groupSteps.some((step) => step.id === selectedStepId);

          return (
            <button
              className={`path-card ${isSelected ? 'selected' : ''}`}
              key={group}
              onClick={() => firstStep && onSelectStep(firstStep.id)}
            >
              <span className="path-number">{doneCount === groupSteps.length && groupSteps.length > 0 ? 'Done' : index + 1}</span>
              <span>
                <strong>{group}</strong>
                <small>{doneCount} of {groupSteps.length} done</small>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add step detail component**

Create `src\components\StepDetail.tsx`:

```tsx
import { resources, steps } from '../data';
import type { StepStatus } from '../types';

type StepDetailProps = {
  stepId: string;
  status: StepStatus;
  onMarkDone: (stepId: string) => void;
  onNeedHelp: (stepId: string, text: string) => void;
  onAskNicNac: (text: string) => void;
};

export function StepDetail({ stepId, status, onMarkDone, onNeedHelp, onAskNicNac }: StepDetailProps) {
  const step = steps.find((item) => item.id === stepId) ?? steps[0];
  const linkedResources = step.resourceIds.map((id) => resources.find((resource) => resource.id === id)).filter(Boolean);

  return (
    <aside className="step-detail">
      <span className="eyebrow">Next Step</span>
      <h2>{step.title}</h2>

      <div className="detail-block">
        <h3>What to do</h3>
        <p>{step.whatToDo}</p>
      </div>

      <div className="detail-block">
        <h3>Why it matters</h3>
        <p>{step.whyItMatters}</p>
      </div>

      {linkedResources.length > 0 && (
        <div className="detail-block">
          <h3>Helpful links</h3>
          <div className="resource-links">
            {linkedResources.map((resource) => resource && (
              resource.url ? (
                <a href={resource.url} target="_blank" rel="noreferrer" key={resource.id}>
                  {resource.title}
                </a>
              ) : (
                <span key={resource.id}>{resource.title}</span>
              )
            ))}
          </div>
        </div>
      )}

      <div className="brittany-note">
        <h3>Brittany's note</h3>
        <p>{step.brittanyNote}</p>
      </div>

      <div className="step-actions">
        <button className="success-button" onClick={() => onMarkDone(step.id)}>
          {status === 'done' ? 'Done' : 'Mark done'}
        </button>
        <button className="secondary-button" onClick={() => onNeedHelp(step.id, `I need help with: ${step.title}`)}>
          I need help
        </button>
        <button className="text-button" onClick={() => onAskNicNac(step.title)}>
          Ask Nic-Nac about this
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Wire dashboard and step detail in `App.tsx`**

Replace `src\App.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { StepDetail } from './components/StepDetail';
import { loadState, makeQuestion, saveState } from './state';
import type { AppState } from './types';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(appState);
  }, [appState]);

  function selectStep(stepId: string) {
    setAppState((current) => ({ ...current, selectedStepId: stepId }));
  }

  function markDone(stepId: string) {
    setAppState((current) => ({
      ...current,
      stepStatuses: { ...current.stepStatuses, [stepId]: 'done' },
    }));
  }

  function addQuestion(stepId: string | null, text: string) {
    setAppState((current) => ({
      ...current,
      questions: [makeQuestion(text, stepId, 'rep'), ...current.questions],
      stepStatuses: stepId ? { ...current.stepStatuses, [stepId]: 'needs-help' } : current.stepStatuses,
    }));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">*</div>
        <strong>Britt's Team Start Strong</strong>
        <nav>
          <a href="#home">Home</a>
          <a href="#resources">Resources</a>
          <a href="#questions">Ask Brittany</a>
        </nav>
      </header>
      <div className="main-grid" id="home">
        <Dashboard
          selectedStepId={appState.selectedStepId}
          stepStatuses={appState.stepStatuses}
          onSelectStep={selectStep}
        />
        <StepDetail
          stepId={appState.selectedStepId}
          status={appState.stepStatuses[appState.selectedStepId]}
          onMarkDone={markDone}
          onNeedHelp={addQuestion}
          onAskNicNac={(text) => addQuestion(appState.selectedStepId, `Question for Nic-Nac: ${text}`)}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Replace CSS with the dashboard layout**

Replace `src\styles.css`:

```css
:root {
  font-family: Arial, Helvetica, sans-serif;
  color: #1f2937;
  background: #f8fbff;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input,
textarea {
  font: inherit;
}

a {
  color: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 40px;
  background: linear-gradient(135deg, #f8fbff 0%, #fff7fb 58%, #f6fff9 100%);
}

.topbar,
.hero-card,
.path-card,
.step-detail,
.section-panel,
.resource-card,
.question-item,
.nic-panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
}

.topbar {
  max-width: 1300px;
  margin: 0 auto 24px;
  min-height: 72px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 24px;
}

.brand-mark {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #ec4899;
  color: #ffffff;
  font-weight: 800;
}

.topbar nav {
  margin-left: auto;
  display: flex;
  gap: 24px;
}

.topbar a {
  color: #475569;
  text-decoration: none;
}

.main-grid {
  max-width: 1300px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) 430px;
  gap: 24px;
  align-items: start;
}

.hero-card {
  min-height: 214px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 24px;
  padding: 32px;
  background: #f8fafc;
}

.hero-card h1,
.section-heading h2,
.step-detail h2,
.dashboard h2 {
  margin: 0;
  color: #1e293b;
  letter-spacing: 0;
}

.hero-card h1 {
  font-size: 38px;
  line-height: 1.05;
}

.hero-card p,
.detail-block p,
.brittany-note p,
.section-heading p,
.resource-card p,
.question-item p {
  color: #475569;
  line-height: 1.55;
}

.hero-actions,
.step-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.primary-button,
.secondary-button,
.success-button,
.text-button,
.nic-button,
.nic-panel button {
  min-height: 48px;
  border: 0;
  border-radius: 10px;
  padding: 0 24px;
  font-weight: 700;
  cursor: pointer;
}

.primary-button {
  background: #ec4899;
  color: #ffffff;
}

.success-button {
  background: #22c55e;
  color: #ffffff;
}

.secondary-button {
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.text-button {
  background: transparent;
  color: #be185d;
  padding-inline: 0;
}

.eyebrow {
  display: block;
  margin-bottom: 10px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.progress-box strong {
  display: block;
  color: #1e293b;
  font-size: 24px;
  margin-bottom: 14px;
}

.progress-track {
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.progress-track div {
  height: 100%;
  border-radius: inherit;
  background: #22c55e;
}

.path-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.path-card {
  min-height: 98px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px;
  text-align: left;
  cursor: pointer;
}

.path-card.selected {
  border-color: #ec4899;
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.12);
}

.path-number {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #fce7f3;
  color: #334155;
  font-weight: 800;
  font-size: 13px;
}

.path-card strong,
.resource-card h3 {
  display: block;
  color: #1e293b;
  font-size: 18px;
}

.path-card small {
  display: block;
  margin-top: 8px;
  color: #64748b;
}

.step-detail {
  padding: 32px;
}

.detail-block {
  margin-top: 24px;
}

.detail-block h3,
.brittany-note h3 {
  margin: 0 0 8px;
  color: #64748b;
  font-size: 12px;
  text-transform: uppercase;
}

.resource-links {
  display: grid;
  gap: 10px;
}

.resource-links a,
.resource-card a {
  color: #be185d;
  font-weight: 700;
}

.brittany-note {
  margin-top: 24px;
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
}

.section-panel {
  max-width: 1300px;
  margin: 24px auto 0;
  padding: 32px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.resource-card,
.question-item {
  padding: 20px;
}

.source-pill {
  display: inline-block;
  margin-bottom: 12px;
  border-radius: 999px;
  padding: 6px 10px;
  color: #475569;
  background: #f1f5f9;
  font-size: 12px;
  font-weight: 800;
}

.source-pill.official {
  color: #075985;
  background: #e0f2fe;
}

.source-pill.team {
  color: #be185d;
  background: #fce7f3;
}

.muted-link,
.empty-state,
.question-item span {
  color: #64748b;
}

.question-list {
  display: grid;
  gap: 12px;
}

.nic-nac {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 20;
}

.nic-button {
  background: #1e293b;
  color: #ffffff;
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.22);
}

.nic-panel {
  width: 360px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.18);
}

.nic-panel header,
.nic-panel form {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 14px;
  border-bottom: 1px solid #e2e8f0;
}

.nic-panel header button {
  margin-left: auto;
  min-height: 36px;
  padding: 0 12px;
}

.nic-messages {
  max-height: 280px;
  display: grid;
  gap: 10px;
  overflow: auto;
  padding: 14px;
  background: #f8fafc;
}

.nic-messages p {
  margin: 0;
  border-radius: 12px;
  padding: 10px 12px;
  color: #334155;
  background: #ffffff;
}

.nic-messages .rep {
  color: #ffffff;
  background: #ec4899;
}

.nic-panel form {
  border-top: 1px solid #e2e8f0;
  border-bottom: 0;
}

.nic-panel input {
  min-width: 0;
  flex: 1;
  min-height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0 12px;
}

.nic-panel form button {
  min-height: 42px;
  background: #ec4899;
  color: #ffffff;
}

@media (max-width: 900px) {
  .app-shell {
    padding: 16px;
  }

  .topbar,
  .topbar nav,
  .hero-card,
  .main-grid,
  .path-grid,
  .resource-grid {
    grid-template-columns: 1fr;
  }

  .topbar {
    align-items: flex-start;
    flex-direction: column;
    padding: 20px;
  }

  .topbar nav {
    display: flex;
    margin-left: 0;
  }

  .hero-card h1 {
    font-size: 32px;
  }

  .nic-nac {
    right: 12px;
    bottom: 12px;
    left: 12px;
  }

  .nic-panel {
    width: 100%;
  }
}
```

- [ ] **Step 5: Build**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src
git commit -m "feat: add clickable checklist dashboard"
```

Expected: commit succeeds.

## Task 4: Add Resources, Questions, And Nic-Nac

**Files:**

- Modify: `C:\Users\louis\britt-with-bling-start-strong\src\App.tsx`
- Create: `C:\Users\louis\britt-with-bling-start-strong\src\components\Resources.tsx`
- Create: `C:\Users\louis\britt-with-bling-start-strong\src\components\Questions.tsx`
- Create: `C:\Users\louis\britt-with-bling-start-strong\src\components\NicNac.tsx`
- Modify: `C:\Users\louis\britt-with-bling-start-strong\src\styles.css`

- [ ] **Step 1: Add resources component**

Create `src\components\Resources.tsx`:

```tsx
import { resources } from '../data';

export function Resources() {
  const official = resources.filter((resource) => resource.sourceType === 'official');
  const team = resources.filter((resource) => resource.sourceType === 'team');

  return (
    <section className="section-panel" id="resources">
      <div className="section-heading">
        <span className="eyebrow">Resource Binder</span>
        <h2>Helpful links</h2>
        <p>Official Bomb Party links stay separate from Brittany's team notes.</p>
      </div>

      <div className="resource-grid">
        {[...official, ...team].map((resource) => (
          <article className="resource-card" key={resource.id}>
            <span className={`source-pill ${resource.sourceType}`}>{resource.sourceType === 'official' ? 'Official' : 'Team note'}</span>
            <h3>{resource.title}</h3>
            <p>{resource.description}</p>
            {resource.url ? (
              <a href={resource.url} target="_blank" rel="noreferrer">Open resource</a>
            ) : (
              <span className="muted-link">Demo note only</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add questions component**

Create `src\components\Questions.tsx`:

```tsx
import type { RepQuestion } from '../types';

type QuestionsProps = {
  questions: RepQuestion[];
};

export function Questions({ questions }: QuestionsProps) {
  return (
    <section className="section-panel" id="questions">
      <div className="section-heading">
        <span className="eyebrow">Ask Brittany</span>
        <h2>Saved questions</h2>
        <p>Questions Nic-Nac should not answer get saved here for Brittany.</p>
      </div>

      {questions.length === 0 ? (
        <p className="empty-state">No questions yet. If you get stuck, tap I need help or ask Nic-Nac.</p>
      ) : (
        <div className="question-list">
          {questions.map((question) => (
            <article className="question-item" key={question.id}>
              <span>{question.source === 'nic-nac' ? 'Saved by Nic-Nac' : 'Saved by rep'}</span>
              <p>{question.text}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Add Nic-Nac component**

Create `src\components\NicNac.tsx`:

```tsx
import { useState } from 'react';
import { nicNacAnswers, resources } from '../data';
import type { RepQuestion } from '../types';

type Message = {
  role: 'rep' | 'nic-nac';
  text: string;
};

type NicNacProps = {
  selectedStepId: string;
  onEscalate: (question: RepQuestion) => void;
};

export function NicNac({ selectedStepId, onEscalate }: NicNacProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'nic-nac',
      text: 'Hi, I can help with the checklist, BPU, official links, simple setup questions, and knowing when to ask Brittany.',
    },
  ]);

  function askNicNac(text: string) {
    const normalized = text.toLowerCase();
    const answer = nicNacAnswers.find((item) => item.triggers.some((trigger) => normalized.includes(trigger)));
    const fallback = {
      response: 'I want you to get the right answer on that one. I saved it as a question for Brittany.',
      resourceIds: [],
      shouldEscalate: true,
    };
    const result = answer ?? fallback;
    const linkedResources = result.resourceIds
      .map((id) => resources.find((resource) => resource.id === id))
      .filter(Boolean)
      .map((resource) => resource?.title)
      .join(', ');
    const responseText = linkedResources ? `${result.response} Resource: ${linkedResources}.` : result.response;

    setMessages((current) => [
      ...current,
      { role: 'rep', text },
      { role: 'nic-nac', text: responseText },
    ]);

    if (result.shouldEscalate) {
      onEscalate({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        stepId: selectedStepId,
        text,
        status: 'open',
        source: 'nic-nac',
      });
    }
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    askNicNac(text);
    setDraft('');
  }

  return (
    <div className={`nic-nac ${isOpen ? 'open' : ''}`}>
      {isOpen && (
        <section className="nic-panel" aria-label="Nic-Nac helper">
          <header>
            <strong>Ask Nic-Nac</strong>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close Nic-Nac">×</button>
          </header>
          <div className="nic-messages">
            {messages.map((message, index) => (
              <p className={message.role} key={`${message.role}-${index}`}>{message.text}</p>
            ))}
          </div>
          <form onSubmit={submitForm}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask a simple question"
              aria-label="Ask Nic-Nac a question"
            />
            <button type="submit">Ask</button>
          </form>
        </section>
      )}
      <button className="nic-button" type="button" onClick={() => setIsOpen((current) => !current)}>
        Nic-Nac
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Wire new components in `App.tsx`**

Replace `src\App.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { NicNac } from './components/NicNac';
import { Questions } from './components/Questions';
import { Resources } from './components/Resources';
import { StepDetail } from './components/StepDetail';
import { loadState, makeQuestion, saveState } from './state';
import type { AppState, RepQuestion } from './types';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(appState);
  }, [appState]);

  function selectStep(stepId: string) {
    setAppState((current) => ({ ...current, selectedStepId: stepId }));
  }

  function markDone(stepId: string) {
    setAppState((current) => ({
      ...current,
      stepStatuses: { ...current.stepStatuses, [stepId]: 'done' },
    }));
  }

  function addQuestion(stepId: string | null, text: string) {
    setAppState((current) => ({
      ...current,
      questions: [makeQuestion(text, stepId, 'rep'), ...current.questions],
      stepStatuses: stepId ? { ...current.stepStatuses, [stepId]: 'needs-help' } : current.stepStatuses,
    }));
  }

  function addNicNacQuestion(question: RepQuestion) {
    setAppState((current) => ({
      ...current,
      questions: [question, ...current.questions],
      stepStatuses: question.stepId
        ? { ...current.stepStatuses, [question.stepId]: 'needs-help' }
        : current.stepStatuses,
    }));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">*</div>
        <strong>Britt's Team Start Strong</strong>
        <nav>
          <a href="#home">Home</a>
          <a href="#resources">Resources</a>
          <a href="#questions">Ask Brittany</a>
        </nav>
      </header>

      <div className="main-grid" id="home">
        <Dashboard
          selectedStepId={appState.selectedStepId}
          stepStatuses={appState.stepStatuses}
          onSelectStep={selectStep}
        />
        <StepDetail
          stepId={appState.selectedStepId}
          status={appState.stepStatuses[appState.selectedStepId]}
          onMarkDone={markDone}
          onNeedHelp={addQuestion}
          onAskNicNac={(text) => addQuestion(appState.selectedStepId, `Question for Nic-Nac: ${text}`)}
        />
      </div>

      <Resources />
      <Questions questions={appState.questions} />
      <NicNac selectedStepId={appState.selectedStepId} onEscalate={addNicNacQuestion} />
    </main>
  );
}
```

- [ ] **Step 5: Add CSS for sections and Nic-Nac**

Confirm `src\styles.css` still contains these selectors from Task 3:

```text
.section-panel
.section-heading
.resource-grid
.resource-card
.source-pill
.question-list
.question-item
.empty-state
.nic-nac
.nic-button
.nic-panel
.nic-messages
```

If any selector is missing, restore the full CSS block from Task 3 Step 4 before running the build.

- [ ] **Step 6: Manual checks**

Run:

```powershell
npm run dev
```

Open the local URL. Verify:

- clicking path cards changes the selected step
- `Mark done` updates progress
- `I need help` adds a saved question
- resources open in a new tab
- Nic-Nac opens and answers `Where is BPU?`
- Nic-Nac escalates `Should I spend $500 on inventory?`

- [ ] **Step 7: Build**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 8: Commit**

Run:

```powershell
git add src
git commit -m "feat: add resources questions and nic nac helper"
```

Expected: commit succeeds.

## Task 5: Add README And Domain Handoff Notes

**Files:**

- Create: `C:\Users\louis\britt-with-bling-start-strong\README.md`

- [ ] **Step 1: Add README**

Create `README.md`:

```md
# Britt's Team Start Strong

Clickable pilot for Brittany's new Bomb Party reps.

## Purpose

This app helps new reps find answers, follow a setup path, and know when to ask Brittany.

It does not replace Bomb Party University, Bomb Party support, or Brittany's mentorship.

## Pilot Scope

- Checklist path
- Official resource links
- Demo Brittany notes
- Saved questions
- Floating Nic-Nac helper with canned prototype responses
- Local browser progress only

## Domain Options

Preferred pilot deployment:

- `start.brittwithbling.com`

Possible later route if Brittany's domain host supports it:

- `brittwithbling.com/start-strong`

## Content Sources

Official Bomb Party and FTC resources are linked in the app. Demo team guidance must be reviewed by Brittany before it is treated as real team guidance.
```

- [ ] **Step 2: Build**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

Run:

```powershell
git add README.md
git commit -m "docs: add pilot handoff notes"
```

Expected: commit succeeds.

## Self-Review

Spec coverage:

- Separate repo: Task 1 creates `C:\Users\louis\britt-with-bling-start-strong`.
- Clickable skeleton: Tasks 3 and 4 implement dashboard, step selection, resources, questions, and Nic-Nac.
- Credible links: Task 2 seeds official Bomb Party, FTC, shipping, return, BPU, and enrollment links.
- Dummy content: Task 2 labels Brittany notes as sample guidance.
- Nic-Nac corner: Task 4 implements lower-right floating helper.
- Domain note: Task 5 documents subdomain and path options.

Placeholder scan:

- The app contains demo content by design, labeled as sample Brittany guidance.
- No implementation step relies on undefined behavior.

Type consistency:

- `AppState`, `ChecklistStep`, `Resource`, `RepQuestion`, and `NicNacAnswer` are defined before use.
- Component props reference types defined in `src\types.ts`.

## Execution Handoff

Plan complete. Recommended execution path is subagent-driven development with one worker per task, reviewing after each task. Inline execution is also reasonable because this is a small new repo with a narrow write set.
