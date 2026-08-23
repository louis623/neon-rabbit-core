import { useCallback, useEffect, useState } from 'react';
import { nicNacAnswers, resources, steps } from '../data';
import type { RepQuestion } from '../types';

type Message = {
  role: 'rep' | 'nic-nac';
  text: string;
};

type NicNacProps = {
  selectedStepId: string;
  prompt: string | null;
  closeSignal: number;
  onPromptHandled: () => void;
  onEscalate: (question: RepQuestion) => void;
  teamLeadName: string;
};

const quickQuestions = [
  'What do I do first?',
  'How do I get into BPU?',
  'What is PayQuicker?',
  'How do payouts work?',
  'What supplies do I need?',
  'What is Ship.com?',
  'How do fizz points work?',
  'Hard Bomb Party truths',
];

export function NicNac({ selectedStepId, prompt, closeSignal, onPromptHandled, onEscalate, teamLeadName }: NicNacProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'nic-nac',
      text: 'Hi, I can help with your getting-started path, getting into BPU, PayQuicker, setup, shipping, loyalty basics, and knowing when to ask your team lead.',
    },
  ]);

  const askNicNac = useCallback((text: string) => {
    const normalized = text.toLowerCase();
    const selectedStep = steps.find((step) => step.id === selectedStepId);
    const answer = nicNacAnswers.find((item) => item.triggers.some((trigger) => normalized.includes(trigger)));
    const fallback = {
      response: `I want you to get the right answer on that one. I saved it as a question for ${teamLeadName}.`,
      resourceIds: [],
      shouldEscalate: true,
    };
    const result = answer ?? fallback;
    const linkedResources = result.resourceIds
      .map((id) => resources.find((resource) => resource.id === id))
      .filter(Boolean)
      .map((resource) => resource?.title)
      .join(', ');
    const stepContext = selectedStep ? ` You are currently on: ${selectedStep.shortTitle}.` : '';
    const responseText = (linkedResources
      ? `${result.response} Resource: ${linkedResources}.${stepContext}`
      : `${result.response}${stepContext}`)
      .replaceAll('Brittany', teamLeadName);

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
        createdAt: new Date().toLocaleString(),
      });
    }
  }, [onEscalate, selectedStepId, teamLeadName]);

  useEffect(() => {
    if (!prompt) return;
    setIsOpen(true);
    askNicNac(prompt);
    onPromptHandled();
  }, [askNicNac, onPromptHandled, prompt]);

  useEffect(() => {
    setIsOpen(false);
  }, [closeSignal]);

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
            <div>
              <strong>Ask Nic-Nac</strong>
              <span>Setup help and simple answers</span>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close Nic-Nac">Close</button>
          </header>
          <div className="quick-row" aria-label="Quick questions">
            {quickQuestions.map((question) => (
              <button key={question} type="button" onClick={() => askNicNac(question)}>{question}</button>
            ))}
          </div>
          <div className="nic-messages">
            {messages.map((message, index) => (
              <p className={message.role === 'nic-nac' ? 'nic-reply' : 'rep'} key={`${message.role}-${index}`}>{message.text}</p>
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
