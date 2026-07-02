import { steps } from '../data';
import type { RepQuestion } from '../types';

type QuestionsProps = {
  questions: RepQuestion[];
  remoteQuestionStatus?: string | null;
};

export function Questions({ questions, remoteQuestionStatus }: QuestionsProps) {
  return (
    <section className="section-panel" id="questions">
      <div className="section-heading">
        <span className="eyebrow">Ask Brittany</span>
        <h2>Saved questions</h2>
        <p>Questions Nic-Nac should not answer get saved here for Brittany.</p>
        <p>Questions are saved here and sent to Brittany's Sparkle Suite team workspace when your invite link is active.</p>
        {remoteQuestionStatus && <p className="integration-status">{remoteQuestionStatus}</p>}
      </div>

      {questions.length === 0 ? (
        <p className="empty-state">No questions yet. If you get stuck, tap I need help or ask Nic-Nac.</p>
      ) : (
        <div className="question-list">
          {questions.map((question) => {
            const step = question.stepId ? steps.find((item) => item.id === question.stepId) : null;
            return (
              <article className="question-item" key={question.id}>
                <span>{question.source === 'nic-nac' ? 'Saved by Nic-Nac' : 'Saved by rep'}</span>
                {step && <strong>{step.shortTitle}</strong>}
                <p>{question.text}</p>
                <small>{question.createdAt}</small>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
