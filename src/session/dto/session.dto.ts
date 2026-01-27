export interface CreateSessionDto {
  bookingId?: string; // Primary method - Create from booking
  patientId?: string; // Legacy - Create from patient
  patientName?: string; // Legacy - Auto-create patient first
  chiefComplaint?: string;
  visitId?: string;

  // For patientName flow - optional patient info
  patientInfo?: {
    gender?: string;
    age?: number;
    address?: string;
    phoneNumber?: string;
  };
  medicalHistory?: string;
}

export interface SessionResponseDto {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    patientId: string | null;
    bookingId: string | null;
    visitNumber: number;
    chiefComplaint: string | null;
    visitId: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;

    // For legacy patientName flow
    patientName?: string;
    patientDisplayId?: string;
    patient?: any;
  };
  error?: string;
  details?: string;
}

export interface SessionDetailResponseDto {
  success: boolean;
  data?: {
    session: {
      id: string;
      patientId: string | null;
      bookingId: string | null;
      visitNumber: number;
      chiefComplaint: string | null;
      visitId: string | null;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    };
    medicalRecord: {
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
    } | null;
  };
  error?: string;
  message?: string;
  details?: string;
}
