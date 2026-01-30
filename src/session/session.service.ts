import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import {
  examinationSessions,
  medicalRecords,
} from '../database/schema/session.schema';
import { bookings } from '../database/schema/booking.schema';

@Injectable()
export class SessionService {
  constructor(private readonly databaseService: DatabaseService) { }

  /**
   * Create session from booking (Primary method)
   */
  async createSessionFromBooking(bookingId: string, chiefComplaint?: string) {
    const db = this.databaseService.getDatabase();

    // Get visit number for this booking
    const countResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(examinationSessions)
      .where(eq(examinationSessions.bookingId, bookingId));

    const visitNumber = (countResult[0]?.count || 0) + 1;

    // Insert session
    const sessionData = {
      bookingId,
      patientId: null, // Not using patient_id for booking-based sessions
      visitNumber,
      chiefComplaint: chiefComplaint || null,
      visitId: null,
      status: 'active' as const,
    };

    const result = await db
      .insert(examinationSessions)
      .values(sessionData)
      .returning();

    return result[0];
  }

  /**
   * Create session from patient (Legacy method)
   */
  async createSessionFromPatient(
    patientId: string,
    chiefComplaint?: string,
    visitId?: string,
  ) {
    const db = this.databaseService.getDatabase();

    // Get visit number for this patient
    const countResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(examinationSessions)
      .where(eq(examinationSessions.patientId, patientId));

    const visitNumber = (countResult[0]?.count || 0) + 1;

    // Insert session
    const sessionData = {
      patientId,
      bookingId: null,
      visitNumber,
      chiefComplaint: chiefComplaint || null,
      visitId: visitId || null,
      status: 'active' as const,
    };

    const result = await db
      .insert(examinationSessions)
      .values(sessionData)
      .returning();

    return result[0];
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string) {
    const db = this.databaseService.getDatabase();

    const results = await db
      .select()
      .from(examinationSessions)
      .where(eq(examinationSessions.id, sessionId))
      .limit(1);

    return results[0] || null;
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

  /**
   * Delete session by ID (with cascade delete of medical records)
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const db = this.databaseService.getDatabase();

    // First, check if session exists
    const session = await this.getSessionById(sessionId);
    if (!session) {
      return false;
    }

    // Delete associated medical records first 
    await db
      .delete(medicalRecords)
      .where(eq(medicalRecords.sessionId, sessionId));

    // Delete the session
    await db
      .delete(examinationSessions)
      .where(eq(examinationSessions.id, sessionId));

    return true;
  }
}
