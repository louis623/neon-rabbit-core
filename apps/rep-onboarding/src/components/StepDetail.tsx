import { resources, steps } from '../data';
import type { StepStatus } from '../types';

type StepDetailProps = {
  stepId: string;
  status: StepStatus;
  onMarkDone: (stepId: string) => void;
  onNeedHelp: (stepId: string, text: string) => void;
  onAskNicNac: (text: string) => void;
  teamLeadName: string;
};

export function StepDetail({ stepId, status, onMarkDone, onNeedHelp, onAskNicNac, teamLeadName }: StepDetailProps) {
  const step = steps.find((item) => item.id === stepId) ?? steps[0];
  const teamCopy = (value: string) => value.replaceAll('Brittany', teamLeadName);
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
          <p>{teamCopy(step.whatToDo)}</p>
      </div>

      <div className="detail-block">
        <h3>Why it matters</h3>
          <p>{teamCopy(step.whyItMatters)}</p>
      </div>

      {linkedResources.length > 0 && (
        <div className="detail-block">
          <h3>Helpful links</h3>
          <div className="resource-links">
            {linkedResources.map((resource) => resource && (
              resource.url ? (
                <a href={resource.url} target="_blank" rel="noreferrer" key={resource.id}>
                  {teamCopy(resource.title)}
                </a>
              ) : (
                <span key={resource.id}>{teamCopy(resource.title)}</span>
              )
            ))}
          </div>
          {linkedResources.some((resource) => resource?.details) && (
            <div className="resource-notes">
              {linkedResources.map((resource) => resource?.details && (
                <ul key={`${resource.id}-details`}>
                  {resource.details.map((detail) => (
                    typeof detail === 'string' ? (
                      <li key={detail}>{detail}</li>
                    ) : detail.kind === 'video' ? (
                      <li className="video-resource" key={detail.url}>
                        <video controls preload="metadata" src={detail.url}>
                          <a href={detail.url}>Open video</a>
                        </video>
                          <a href={detail.url} target="_blank" rel="noreferrer">{teamCopy(detail.label)}</a>
                        {detail.note && <span>{teamCopy(detail.note)}</span>}
                      </li>
                    ) : (
                      <li key={detail.url}>
                        <a href={detail.url} target="_blank" rel="noreferrer">{teamCopy(detail.label)}</a>
                        {detail.note && <span>{teamCopy(detail.note)}</span>}
                      </li>
                    )
                  ))}
                </ul>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="brittany-note">
        <h3>{teamLeadName}&apos;s note</h3>
        <p>{teamCopy(step.brittanyNote)}</p>
      </div>

      <div className="nic-hint">
        <strong>Nic-Nac can help:</strong>
        <span>{teamCopy(step.nicNacHint)}</span>
      </div>

      <p className="stuck-helper">
        If this step does not make sense, save it for {teamLeadName} so they can see it in their Sparkle Suite team workspace.
      </p>

      <div className="step-actions">
        <button className="success-button" onClick={() => onMarkDone(step.id)}>
          {status === 'done' ? 'Done' : 'Mark done'}
        </button>
        <button className="secondary-button" onClick={() => onNeedHelp(step.id, `I need help with: ${teamCopy(step.title)}`)}>
          I'm stuck
        </button>
        <button className="text-button" onClick={() => onAskNicNac(teamCopy(step.nicNacHint))}>
          Ask Nic-Nac about this
        </button>
      </div>
    </aside>
  );
}
