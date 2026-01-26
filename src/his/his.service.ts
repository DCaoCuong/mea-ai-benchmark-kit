import { Injectable } from '@nestjs/common';
import {
    HISCurrentSessionResponse,
    UpdateVisitDto,
    HISUpdateResponse,
} from './dto/his.dto';

@Injectable()
export class HisService {
    /**
     * Get current session from HIS system (MOCK)
     */
    async getCurrentSession(
        includeContext: boolean = false,
    ): Promise<HISCurrentSessionResponse> {
        // Mock delay to simulate API call
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Mock patient data from HIS system
        const mockSessionData: HISCurrentSessionResponse = {
            success: true,
            data: {
                visitId: `VN${Date.now().toString().slice(-6)}`, // Generate unique visit ID
                patientInfo: {
                    patientId: 'P001234',
                    name: 'Nguyễn Văn A',
                    age: 45,
                    gender: 'Nam',
                    address: 'TP. Hồ Chí Minh',
                    phoneNumber: '0901234567',
                },
                // Only include context if requested
                ...(includeContext && {
                    context: {
                        medicalHistory:
                            'Tiền sử: Tăng huyết áp từ 5 năm nay, đang dùng thuốc hạ áp đều đặn. Gia đình có tiền sử tiểu đường.',
                        allergies: ['Penicillin'],
                        currentMedications: [
                            'Amlodipine 5mg - 1 viên/ngày',
                            'Atorvastatin 10mg - 1 viên/tối',
                        ],
                        lastVisit: '2024-11-15',
                        vitalSigns: {
                            bloodPressure: '135/85 mmHg',
                            heartRate: '78 bpm',
                            temperature: '36.8°C',
                            weight: '72 kg',
                            height: '170 cm',
                        },
                    },
                }),
            },
        };

        return mockSessionData;
    }

    /**
     * Update visit in HIS system (MOCK)
     */
    async updateVisit(
        visitId: string,
        payload: UpdateVisitDto,
    ): Promise<HISUpdateResponse> {
        // Validate required fields
        if (
            !payload.assessment ||
            !payload.icdCodes ||
            payload.icdCodes.length === 0
        ) {
            return {
                success: false,
                error: 'Missing required fields: assessment and icdCodes are required',
            };
        }

        // Mock delay to simulate API call to external system
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Simulate 90% success rate
        const isSuccess = Math.random() > 0.1;

        if (!isSuccess) {
            return {
                success: false,
                error: 'HIS system temporarily unavailable',
                message: 'Failed to sync data with external EMR system',
            };
        }

        // Success response
        return {
            success: true,
            message: 'Medical record successfully synced to HIS system',
            data: {
                visitId: visitId,
                syncedAt: new Date().toISOString(),
                recordId: `EMR_${visitId}_${Date.now()}`,
                // Echo back the synced data
                synced: {
                    subjective: payload.subjective,
                    objective: payload.objective,
                    assessment: payload.assessment,
                    plan: payload.plan,
                    icdCodes: payload.icdCodes,
                },
            },
        };
    }
}
