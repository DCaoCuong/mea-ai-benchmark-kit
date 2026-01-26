export interface SaveMedicalRecordDto {
    sessionId: string;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    icdCodes?: string[];
    status: 'draft' | 'final';
}

export interface UpdateMedicalRecordDto {
    medicalRecordId?: string;
    sessionId: string;
    updates: {
        subjective?: string;
        objective?: string;
        assessment?: string;
        plan?: string;
        icdCodes?: string[];
        status?: 'draft' | 'final';
    };
}

export interface MedicalRecordResponseDto {
    success: boolean;
    message?: string;
    data?: {
        id: string;
        sessionId: string;
        subjective: string | null;
        objective: string | null;
        assessment: string | null;
        plan: string | null;
        icdCodes: unknown;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    };
    error?: string;
    details?: string;
}
