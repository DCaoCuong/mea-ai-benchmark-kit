export interface BookingDetailDto {
    id: string;
    displayId: string | null;
    patientName: string;
    patientPhone: string;
    gender: string | null;
    age: number | null;
    symptoms: string | null;
    address: string | null;
    medicalHistory: string | null;
    allergies: string | null;
    bloodType: string | null;
    bookingTime: Date;
    doctorId: string | null;
    assignedBy: string | null;
    staffNote: string | null;
    status: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export interface MedicalRecordResponseDto {
    success: boolean;
    data?: {
        booking: {
            id: string;
            displayId: string | null;
            patientName: string;
            patientPhone: string;
            age: number | null;
            gender: string | null;
            symptoms: string | null;
            address: string | null;
            medicalHistory: string | null;
            allergies: string | null;
            bloodType: string | null;
            bookingTime: Date;
            status: string | null;
        };
        session: {
            id: string;
            visitNumber: number;
            chiefComplaint: string | null;
            status: string;
            createdAt: Date;
        };
        medicalRecord: {
            id: string;
            subjective: string | null;
            objective: string | null;
            assessment: string | null;
            plan: string | null;
            icdCodes: unknown;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        };
    };
    message?: string;
}
