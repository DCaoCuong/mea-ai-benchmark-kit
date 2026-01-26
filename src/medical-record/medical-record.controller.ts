import {
    Controller,
    Post,
    Body,
    HttpException,
    HttpStatus,
    Patch,
} from '@nestjs/common';
import { MedicalRecordService } from './medical-record.service';
import type {
    SaveMedicalRecordDto,
    UpdateMedicalRecordDto,
} from './dto/medical-record.dto';

@Controller('medical-record')
export class MedicalRecordController {
    constructor(
        private readonly medicalRecordService: MedicalRecordService,
    ) { }

    /**
     * POST /medical-record/save
     * Save or update medical record (draft or final)
     */
    @Post('save')
    async saveMedicalRecord(@Body() body: SaveMedicalRecordDto) {
        try {
            // Validate required fields
            if (!body.sessionId) {
                throw new HttpException(
                    {
                        success: false,
                        error: 'Validation error',
                        message: 'Session ID là bắt buộc',
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }

            if (!body.status || !['draft', 'final'].includes(body.status)) {
                throw new HttpException(
                    {
                        success: false,
                        error: 'Validation error',
                        message: 'Status phải là "draft" hoặc "final"',
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }

            // For final records, ensure critical fields are present
            if (body.status === 'final') {
                if (!body.assessment || !body.icdCodes || body.icdCodes.length === 0) {
                    throw new HttpException(
                        {
                            success: false,
                            error: 'Validation error',
                            message:
                                'Chẩn đoán và mã ICD-10 là bắt buộc khi lưu bệnh án chính thức',
                        },
                        HttpStatus.BAD_REQUEST,
                    );
                }
            }

            // Save record using service
            const record = await this.medicalRecordService.saveMedicalRecord(body);

            return {
                success: true,
                message:
                    body.status === 'final'
                        ? 'Bệnh án đã được lưu và đồng bộ với HIS'
                        : 'Bệnh án nháp đã được lưu',
                data: record,
            };
        } catch (error) {
            console.error('❌ Error saving medical record:', error);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                {
                    success: false,
                    error: 'Internal server error',
                    message: 'Không thể lưu bệnh án',
                    details: error instanceof Error ? error.message : 'Unknown error',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * POST /medical-record/update (or PATCH)
     * Update specific fields in a medical record
     */
    @Post('update')
    async updateMedicalRecord(@Body() body: UpdateMedicalRecordDto) {
        try {
            const { sessionId, updates } = body;

            // Validate required fields
            if (!sessionId) {
                throw new HttpException(
                    {
                        success: false,
                        error: 'Validation error',
                        message: 'Session ID hoặc Medical Record ID là bắt buộc',
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }

            if (!updates || typeof updates !== 'object') {
                throw new HttpException(
                    {
                        success: false,
                        error: 'Validation error',
                        message: 'Updates object là bắt buộc',
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }

            // Get existing record
            const existingRecord =
                await this.medicalRecordService.getMedicalRecordBySession(sessionId);

            if (!existingRecord) {
                throw new HttpException(
                    {
                        success: false,
                        error: 'Not found',
                        message: 'Bệnh án không tồn tại',
                    },
                    HttpStatus.NOT_FOUND,
                );
            }

            // Merge updates with existing data
            const updatedData: SaveMedicalRecordDto = {
                sessionId: existingRecord.sessionId,
                subjective: updates.subjective ?? existingRecord.subjective ?? undefined,
                objective: updates.objective ?? existingRecord.objective ?? undefined,
                assessment: updates.assessment ?? existingRecord.assessment ?? undefined,
                plan: updates.plan ?? existingRecord.plan ?? undefined,
                icdCodes:
                    updates.icdCodes ?? (existingRecord.icdCodes as string[]) ?? undefined,
                status: (updates.status ?? existingRecord.status) as 'draft' | 'final',
            };

            // Save updated record
            const record =
                await this.medicalRecordService.saveMedicalRecord(updatedData);

            return {
                success: true,
                message: 'Bệnh án đã được cập nhật',
                data: record,
            };
        } catch (error) {
            console.error('❌ Error updating medical record:', error);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                {
                    success: false,
                    error: 'Internal server error',
                    message: 'Không thể cập nhật bệnh án',
                    details: error instanceof Error ? error.message : 'Unknown error',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
