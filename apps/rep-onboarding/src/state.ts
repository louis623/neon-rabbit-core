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
    const selectedStepId = typeof parsed.selectedStepId === 'string'
      && steps.some((step) => step.id === parsed.selectedStepId)
      ? parsed.selectedStepId
      : fallback.selectedStepId;

    return {
      selectedStepId,
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

export function resetState() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getProgress(stepStatuses: Record<string, StepStatus>) {
  const done = steps.filter((step) => stepStatuses[step.id] === 'done').length;
  return { done, total: steps.length, percent: Math.round((done / steps.length) * 100) };
}

export function makeQuestion(text: string, stepId: string | null, source: RepQuestion['source']): RepQuestion {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    stepId,
    text,
    status: 'open',
    source,
    createdAt: new Date().toLocaleString(),
  };
}
