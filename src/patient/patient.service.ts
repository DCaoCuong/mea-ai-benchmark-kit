import { Injectable } from '@nestjs/common';
import { eq, sql, like, or, and, desc, ilike } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { users } from '../database/schema/user.schema';
import {
  examinationSessions,
  medicalRecords,
} from '../database/schema/session.schema';
import { CreatePatientDto, PatientSearchResult } from './dto/patient.dto';

@Injectable()
export class PatientService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Generate patient display ID (BN-YYYY-NNNNNN)
   */
  async generateDisplayId(): Promise<string> {
    const db = this.databaseService.getDatabase();
    const year = new Date().getFullYear();
    const prefix = `BN-${year}-`;

    // Get last patient of this year
    const lastPatient = await db
      .select({ displayId: users.displayId })
      .from(users)
      .where(
        and(like(users.displayId, `${prefix}%`), eq(users.role, 'patient')),
      )
      .orderBy(desc(users.displayId))
      .limit(1);

    let nextNumber = 1;
    if (lastPatient.length > 0 && lastPatient[0].displayId) {
      const parts = lastPatient[0].displayId.split('-');
      const lastNumber = parseInt(parts[2], 10);
      nextNumber = lastNumber + 1;
    }

    const paddedNumber = nextNumber.toString().padStart(6, '0');
    return `${prefix}${paddedNumber}`;
  }

  /**
   * Find possible duplicates based on email, phone, name+birthdate
   */
  async findPossibleDuplicates(input: CreatePatientDto) {
    const db = this.databaseService.getDatabase();
    const conditions: any[] = [];

    if (input.email) {
      conditions.push(eq(users.email, input.email));
    }

    if (input.phone) {
      conditions.push(eq(users.phone, input.phone));
    }

    if (input.name && input.birthDate) {
      conditions.push(
        and(eq(users.name, input.name), eq(users.birthDate, input.birthDate)),
      );
    }

    if (conditions.length === 0) {
      return [];
    }

    const results = await db
      .select()
      .from(users)
      .where(or(...conditions));

    // Remove duplicates (same user matched multiple criteria)
    const uniqueResults = Array.from(
      new Map(results.map((u) => [u.id, u])).values(),
    );

    return uniqueResults;
  }

  /**
   * Create patient with duplicate check
   */
  async createPatient(input: CreatePatientDto, force: boolean = false) {
    const db = this.databaseService.getDatabase();

    // Check duplicates unless force=true
    if (!force) {
      const duplicates = await this.findPossibleDuplicates(input);
      if (duplicates.length > 0) {
        return {
          success: false,
          error: 'POSSIBLE_DUPLICATE',
          duplicates,
        };
      }
    }

    // Generate display ID for patients
    const role = input.role || 'patient';
    const displayId =
      role === 'patient' ? await this.generateDisplayId() : null;

    const userData = {
      email: input.email,
      password: input.password || null,
      role,
      name: input.name,
      phone: input.phone || null,
      avatarUrl: null,
      displayId,
      birthDate: input.birthDate || null,
      gender: input.gender || null,
      address: input.address || null,
      medicalHistory: input.medicalHistory || null,
      allergies: input.allergies || null,
      bloodType: input.bloodType || null,
      externalPatientId: input.externalPatientId || null,
    };

    const result = await db.insert(users).values(userData).returning();

    return {
      success: true,
      patient: result[0],
    };
  }

  /**
   * Get patient by ID
   */
  async getPatientById(patientId: string) {
    const db = this.databaseService.getDatabase();

    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, patientId))
      .limit(1);

    return result[0] || null;
  }

  /**
   * List patients with pagination
   */
  async listPatients(options: { page?: number; limit?: number } = {}) {
    const db = this.databaseService.getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    // Get patients
    const results = await db
      .select({
        id: users.id,
        displayId: users.displayId,
        name: users.name,
        birthDate: users.birthDate,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.role, 'patient'))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(users)
      .where(eq(users.role, 'patient'));

    const total = countResult[0]?.count || 0;
    const pages = Math.ceil(total / limit);

    // TODO: Add totalVisits and lastVisitDate from sessions
    const enrichedResults: PatientSearchResult[] = results.map((p) => ({
      ...p,
      totalVisits: 0,
      lastVisitDate: null,
    }));

    return {
      patients: enrichedResults,
      total,
      pages,
    };
  }

  /**
   * Search patients by name, phone, or displayId
   */
  async searchPatients(
    query: string,
    options: { page?: number; limit?: number } = {},
  ) {
    const db = this.databaseService.getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const searchPattern = `%${query}%`;

    // Search
    const results = await db
      .select({
        id: users.id,
        displayId: users.displayId,
        name: users.name,
        birthDate: users.birthDate,
        phone: users.phone,
      })
      .from(users)
      .where(
        and(
          eq(users.role, 'patient'),
          or(
            ilike(users.name, searchPattern),
            ilike(users.phone, searchPattern),
            ilike(users.displayId, searchPattern),
          ),
        ),
      )
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(users)
      .where(
        and(
          eq(users.role, 'patient'),
          or(
            ilike(users.name, searchPattern),
            ilike(users.phone, searchPattern),
            ilike(users.displayId, searchPattern),
          ),
        ),
      );

    const total = countResult[0]?.count || 0;

    // TODO: Add totalVisits and lastVisitDate
    const enrichedResults: PatientSearchResult[] = results.map((p) => ({
      ...p,
      totalVisits: 0,
      lastVisitDate: null,
    }));

    return {
      patients: enrichedResults,
      total,
    };
  }

  /**
   * Get all sessions for a patient
   */
  async getPatientSessions(patientId: string) {
    const db = this.databaseService.getDatabase();

    // Get all sessions for this patient
    const sessions = await db
      .select()
      .from(examinationSessions)
      .where(eq(examinationSessions.patientId, patientId))
      .orderBy(desc(examinationSessions.createdAt));

    // For each session, get medical record if exists
    const sessionsWithRecords = await Promise.all(
      sessions.map(async (session) => {
        const records = await db
          .select()
          .from(medicalRecords)
          .where(eq(medicalRecords.sessionId, session.id))
          .limit(1);

        return {
          ...session,
          medicalRecord: records[0] || null,
        };
      }),
    );

    return {
      sessions: sessionsWithRecords,
      total: sessions.length,
    };
  }
}
