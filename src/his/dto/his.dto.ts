export interface HISCurrentSessionResponse {
  success: boolean;
  data?: {
    visitId: string;
    patientInfo: {
      patientId: string;
      name: string;
      age: number;
      gender: string;
      address: string;
      phoneNumber: string;
    };
    context?: {
      medicalHistory: string;
      allergies: string[];
      currentMedications: string[];
      lastVisit: string;
      vitalSigns: {
        bloodPressure: string;
        heartRate: string;
        temperature: string;
        weight: string;
        height: string;
      };
    };
  };
  error?: string;
}

export interface UpdateVisitDto {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icdCodes: string[];
}

export interface HISUpdateResponse {
  success: boolean;
  message?: string;
  data?: {
    visitId: string;
    syncedAt: string;
    recordId: string;
    synced?: UpdateVisitDto;
  };
  error?: string;
}
