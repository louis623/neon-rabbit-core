export type ResourceSourceType = 'official' | 'team' | 'sparkle-suite';

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
  shortTitle: string;
  dayWindow: string;
  whatToDo: string;
  whyItMatters: string;
  resourceIds: string[];
  brittanyNote: string;
  nicNacHint: string;
};

export type RepQuestion = {
  id: string;
  stepId: string | null;
  text: string;
  status: 'open' | 'answered';
  source: 'rep' | 'nic-nac';
  createdAt: string;
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
