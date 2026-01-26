export interface CreatePatientDto {
    name: string;
    email: string;
    password?: string;
    role?: 'patient' | 'doctor' | 'staff' | 'admin';
    phone?: string;
    birthDate?: string;
    gender?: string;
    address?: string;
    medicalHistory?: string;
    allergies?: string;
    bloodType?: string;
    externalPatientId?: string;
}

export interface PatientListQuery {
    q?: string; // Search query
    search?: string; // Alternative search field
    page?: number;
    limit?: number;
}

export interface PatientSearchResult {
    id: string;
    displayId: string | null;
    name: string;
    birthDate: string | null;
    phone: string | null;
    totalVisits: number;
    lastVisitDate: Date | null;
}

export interface CreatePatientRequestDto {
    patientData: CreatePatientDto;
    force?: boolean; // Force create, bypass duplicate check
}
