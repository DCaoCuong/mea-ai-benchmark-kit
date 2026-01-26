export interface SoapNote {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
}

export interface ComparisonResult {
    matchScore: number;
    soapMatch: {
        subjective: number;
        objective: number;
        assessment: number;
        plan: number;
    };
    icdMatch: {
        exactMatches: string[];
        aiOnly: string[];
        doctorOnly: string[];
        score: number;
    };
    differences: string[];
}

export interface SubmitComparisonDto {
    sessionId?: string;
    medicalRecordId?: string;
    aiResults: {
        soap: SoapNote;
        icdCodes: string[];
        medicalAdvice?: string;
        references?: string[];
    };
    doctorResults: {
        soap: SoapNote;
        icdCodes: string[];
        treatment?: string;
    };
}
