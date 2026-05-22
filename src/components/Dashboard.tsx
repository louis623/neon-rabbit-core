import { groups, steps } from '../data';
import { getProgress } from '../state';
import type { StepStatus } from '../types';

type DashboardProps = {
  selectedStepId: string;
  stepStatuses: Record<string, StepStatus>;
  questionCount: number;
  onSelectStep: (stepId: string) => void;
  onNeedHelp: () => void;
};

export function Dashboard({ selectedStepId, stepStatuses, questionCount, onSelectStep, onNeedHelp }: DashboardProps) {
  const progress = getProgress(stepStatuses);
  const nextStep = steps.find((step) => stepStatuses[step.id] !== 'done') ?? steps[0];

  return (
    <section className="dashboard" aria-label="Start Strong dashboard">
      <div className="hero-card">
        <div>
          <p className="plain-label">Brittany's new rep path</p>
          <h1>Welcome, Sarah</h1>
          <p>You're getting ready for your first Bomb Party shows.</p>
          <p>Start here. One step at a time.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => onSelectStep(nextStep.id)}>
              Continue next step
            </button>
            <button className="secondary-button" onClick={onNeedHelp}>
              I need help
            </button>
          </div>
        </div>
        <div className="progress-box">
          <span className="eyebrow">Progress</span>
          <strong>{progress.done} of {progress.total} done</strong>
          <div className="progress-track" aria-label={`${progress.percent}% complete`}>
            <div style={{ width: `${progress.percent}%` }} />
          </div>
          <p>Next: {nextStep.title}</p>
          <p>{questionCount} question{questionCount === 1 ? '' : 's'} saved for Brittany</p>
        </div>
      </div>

      <div className="section-title-row">
        <h2>Your Start Strong Path</h2>
        <span>{progress.percent}% complete</span>
      </div>
      <div className="path-grid">
        {groups.map((group, index) => {
          const groupSteps = steps.filter((step) => step.group === group);
          const doneCount = groupSteps.filter((step) => stepStatuses[step.id] === 'done').length;
          const helpCount = groupSteps.filter((step) => stepStatuses[step.id] === 'needs-help').length;
          const firstOpenStep = groupSteps.find((step) => stepStatuses[step.id] !== 'done') ?? groupSteps[0];
          const isSelected = groupSteps.some((step) => step.id === selectedStepId);
          const complete = groupSteps.length > 0 && doneCount === groupSteps.length;

          return (
            <button
              className={`path-card ${isSelected ? 'selected' : ''}`}
              key={group}
              onClick={() => firstOpenStep && onSelectStep(firstOpenStep.id)}
            >
              <span className={`path-number ${complete ? 'complete' : ''}`}>{complete ? 'OK' : index + 1}</span>
              <span className="path-copy">
                <strong>{group}</strong>
                <small>{doneCount} of {groupSteps.length} done</small>
              </span>
              {helpCount > 0 && <span className="status-pill help">Help</span>}
              {complete && <span className="status-pill done">Done</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
