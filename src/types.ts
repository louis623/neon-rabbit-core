export type ResourceSourceType = 'official' | 'team' | 'sparkle-suite';

export type ResourceCategory = 'Start Here' | 'BPU' | 'Money' | 'Supplies' | 'Shipping' | 'Loyalty' | 'Sparkle Suite';

export type StepStatus = 'not-started' | 'done' | 'needs-help';

export type Resource = {
  id: string;
  title: string;
  description: string;
  details?: Array<string | {
    label: string;
    url: string;
    note?: string;
    kind?: 'link' | 'video';
  }>;
  url: string;
  sourceType: ResourceSourceType;
  category: ResourceCategory;
};

export type ChecklistGroup =
  | 'Get Connected'
  | 'Start BPU'
  | 'Pay And Payouts'
  | 'Build Your Setup'
  | 'Shipping And Orders'
  | 'Loyalty And Follow-Up'
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
