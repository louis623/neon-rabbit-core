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
  const linkedResources = step.resourceIds
    .map((id) => resources.find((resource) => resource.id === id))
    .filter((resource) => Boolean(resource));

  return (
    <aside className="step-detail" aria-label="Selected checklist step">
      <div className="step-kicker">
        <span className="eyebrow">{step.dayWindow}</span>
        <span className={`status-dot ${status}`}>{status === 'done' ? 'Done' : status === 'needs-help' ? 'Needs help' : 'Open'}</span>
      </div>
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

      <div className="nic-hint">
        <strong>Nic-Nac can help:</strong>
        <span>{step.nicNacHint}</span>
      </div>

      <div className="step-actions">
        <button className="success-button" onClick={() => onMarkDone(step.id)}>
          {status === 'done' ? 'Done' : 'Mark done'}
        </button>
        <button className="secondary-button" onClick={() => onNeedHelp(step.id, `I need help with: ${step.title}`)}>
          I need help
        </button>
        <button className="text-button" onClick={() => onAskNicNac(step.nicNacHint)}>
          Ask Nic-Nac about this
        </button>
      </div>
    </aside>
  );
}
