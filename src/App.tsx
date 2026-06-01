import { useEffect, useMemo, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { NicNac } from './components/NicNac';
import { Questions } from './components/Questions';
import { Resources } from './components/Resources';
import { StepDetail } from './components/StepDetail';
import { steps } from './data';
import { createInitialState, loadState, makeQuestion, resetState, saveState } from './state';
import type { AppState, RepQuestion } from './types';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadState());
  const [nicNacPrompt, setNicNacPrompt] = useState<string | null>(null);
  const [nicNacCloseSignal, setNicNacCloseSignal] = useState(0);
  const selectedStep = useMemo(
    () => steps.find((step) => step.id === appState.selectedStepId) ?? steps[0],
    [appState.selectedStepId],
  );

  useEffect(() => {
    saveState(appState);
  }, [appState]);

  function selectStep(stepId: string) {
    setAppState((current) => ({ ...current, selectedStepId: stepId }));
  }

  function handleSectionNav() {
    setNicNacCloseSignal((value) => value + 1);
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
      stepStatuses: stepId && current.stepStatuses[stepId] !== 'done'
        ? { ...current.stepStatuses, [stepId]: 'needs-help' }
        : current.stepStatuses,
    }));
  }

  function addNicNacQuestion(question: RepQuestion) {
    setAppState((current) => ({
      ...current,
      questions: [question, ...current.questions],
      stepStatuses: question.stepId && current.stepStatuses[question.stepId] !== 'done'
        ? { ...current.stepStatuses, [question.stepId]: 'needs-help' }
        : current.stepStatuses,
    }));
  }

  function startOver() {
    handleSectionNav();
    resetState();
    setAppState(createInitialState());
  }

  return (
    <main className="app-shell" id="top">
      <header className="topbar">
        <a className="brand-home-link" href="#top">Britt with Bling</a>
        <nav aria-label="Main navigation">
          <a href="#resources" onClick={handleSectionNav}>Resources</a>
          <a href="#questions" onClick={handleSectionNav}>Ask Brittany</a>
        </nav>
        <NicNac
          selectedStepId={appState.selectedStepId}
          prompt={nicNacPrompt}
          closeSignal={nicNacCloseSignal}
          onPromptHandled={() => setNicNacPrompt(null)}
          onEscalate={addNicNacQuestion}
        />
        <button className="reset-button" type="button" onClick={startOver}>Reset demo</button>
      </header>

      <div className="main-grid" id="home">
        <Dashboard
          selectedStepId={appState.selectedStepId}
          stepStatuses={appState.stepStatuses}
          questionCount={appState.questions.length}
          onSelectStep={selectStep}
          onNeedHelp={() => addQuestion(appState.selectedStepId, `I need help with: ${selectedStep.title}`)}
        />
        <StepDetail
          stepId={appState.selectedStepId}
          status={appState.stepStatuses[appState.selectedStepId]}
          onMarkDone={markDone}
          onNeedHelp={addQuestion}
          onAskNicNac={setNicNacPrompt}
        />
      </div>

      <Resources />
      <Questions questions={appState.questions} />

      <footer className="site-footer">
        <span>Continue the shine:</span>
        <nav aria-label="Partner links">
          <a href="https://brittwithbling.com/" target="_blank" rel="noreferrer">Britt with Bling</a>
          <a href="https://www.yoursparklesuite.com/prelaunch" target="_blank" rel="noreferrer">Sparkle Suite coming soon</a>
          <a href="https://neonrabbit.net/" target="_blank" rel="noreferrer">Powered by Neon Rabbit</a>
        </nav>
      </footer>
    </main>
  );
}
