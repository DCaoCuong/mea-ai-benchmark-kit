import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

/**
 * MIGRATION NOTES: PostgreSQL → SQLite
 * ====================================
 * 
 * Original PostgreSQL Schema (from NextJS project):
 * - uuid('id')           → text('id')          [UUID stored as TEXT in SQLite]
 * - timestamp()          → integer(mode: 'timestamp') [Unix timestamp]
 * - jsonb()              → text(mode: 'json')  [JSON stored as TEXT in SQLite]
 * 
 * Data Migration:
 * - UUIDs will be automatically converted to strings
 * - JSONB will be serialized to JSON strings
 * - Timestamps will be converted to Unix timestamps (milliseconds)
 * 
 * Foreign Keys:
 * - Once examinationSessions and medicalRecords tables are created,
 *   uncomment the references below
 */

export const comparisonRecords = sqliteTable('comparison_records', {
    // Primary Key (UUID stored as text)
    // PostgreSQL: uuid('id').primaryKey().defaultRandom()
    // SQLite: text with crypto.randomUUID()
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Timestamp stored as integer (Unix timestamp in milliseconds)
    // PostgreSQL: timestamp('timestamp').defaultNow()
    // SQLite: integer with mode 'timestamp'
    timestamp: integer('timestamp', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),

    // AI Results (Stored as JSON)
    // PostgreSQL: jsonb('ai_results')
    // SQLite: text with mode 'json'
    // Contains: soap, icdCodes, medicalAdvice, references
    aiResults: text('ai_results', { mode: 'json' }).notNull(),

    // Doctor's Results (Stored as JSON)
    // PostgreSQL: jsonb('doctor_results')
    // SQLite: text with mode 'json'
    // Contains: soap, icdCodes, treatment
    doctorResults: text('doctor_results', { mode: 'json' }).notNull(),

    // Comparison Analysis (Stored as JSON)
    // PostgreSQL: jsonb('comparison')
    // SQLite: text with mode 'json'
    // Contains: soapMatch, icdMatch, differences
    comparison: text('comparison', { mode: 'json' }).notNull(),

    // Overall Match Score (0-100)
    matchScore: real('match_score').notNull(),

    // Optional: Patient ID or Case ID for future extension
    caseId: text('case_id'),

    // Session and Medical Record tracking (UUIDs stored as text)
    // PostgreSQL: uuid('session_id').references(...)
    // SQLite: text('session_id').references(...)
    // TODO: Uncomment these lines after creating examinationSessions and medicalRecords schemas
    // sessionId: text('session_id').references(() => examinationSessions.id, { onDelete: 'cascade' }),
    // medicalRecordId: text('medical_record_id').references(() => medicalRecords.id, { onDelete: 'cascade' }),
    sessionId: text('session_id'),
    medicalRecordId: text('medical_record_id'),

    // Metadata
    // PostgreSQL: timestamp('created_at').defaultNow()
    // SQLite: integer with mode 'timestamp'
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export type ComparisonRecord = typeof comparisonRecords.$inferSelect;
export type NewComparisonRecord = typeof comparisonRecords.$inferInsert;