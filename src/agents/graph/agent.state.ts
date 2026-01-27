export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface AgentState {
  transcript: string;

  soap: SoapNote;

  icdCodes: string[];
  medicalAdvice: string;
  references: string[];
}
