export interface PersonaConfig {
  id: string;
  name: string;
  shortName: string;
  file: string;
}

export interface InvokeResult {
  persona: string;
  name: string;
  shortName: string;
  content: string;
  passed: boolean;
  timestamp: string;
}

export interface Reaction {
  fromPersonaId: string;
  toTurnIndex: number;
  type: 'agree' | 'good-point' | 'important';
}

export interface DebateResult {
  turns: InvokeResult[];
  reactions: Reaction[];
  topic: string;
  timestamp: string;
}

export interface Decision {
  id: string;
  summary: string;
  context: string;
  approver: string;
  timestamp: string;
}
