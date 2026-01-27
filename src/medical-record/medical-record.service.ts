import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { medicalRecords } from '../database/schema/session.schema';
import { SaveMedicalRecordDto } from './dto/medical-record.dto';

@Injectable()
export class MedicalRecordService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Save or update medical record
   * If record exists for session, update it. Otherwise create new.
   */
  async saveMedicalRecord(input: SaveMedicalRecordDto) {
    const db = this.databaseService.getDatabase();

    // Check if record already exists for this session
    const existingRecords = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.sessionId, input.sessionId))
      .limit(1);

    const now = new Date();

    if (existingRecords.length > 0) {
      // Update existing record
      const recordId = existingRecords[0].id;
      await db
        .update(medicalRecords)
        .set({
          subjective: input.subjective,
          objective: input.objective,
          assessment: input.assessment,
          plan: input.plan,
          icdCodes: input.icdCodes || [],
          status: input.status,
          updatedAt: now,
        })
        .where(eq(medicalRecords.id, recordId));

      // Fetch updated record
      const updated = await db
        .select()
        .from(medicalRecords)
        .where(eq(medicalRecords.id, recordId))
        .limit(1);

      return updated[0];
    } else {
      // Create new record
      const recordData = {
        sessionId: input.sessionId,
        subjective: input.subjective || null,
        objective: input.objective || null,
        assessment: input.assessment || null,
        plan: input.plan || null,
        icdCodes: input.icdCodes || [],
        diagnosis: input.assessment || null, // Duplicate for Booking compatibility
        prescription: input.plan || null, // Duplicate for Booking compatibility
        status: input.status,
      };

      const result = await db
        .insert(medicalRecords)
        .values(recordData)
        .returning();

      return result[0];
    }
  }

  /**
   * Get medical record by session ID
   */
  async getMedicalRecordBySession(sessionId: string) {
    const db = this.databaseService.getDatabase();

    const results = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.sessionId, sessionId))
      .limit(1);

    return results[0] || null;
  }
}
