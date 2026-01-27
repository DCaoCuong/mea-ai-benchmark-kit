import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Users Table
 * Handles both patients and staff (doctors, nurses, admin)
 */
export const users = pgTable('users', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),

  // Authentication
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),

  // Role: patient | doctor | staff | admin
  role: varchar('role', { length: 50 }).notNull().default('patient'),

  // Basic Info
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  avatarUrl: text('avatar_url'),

  // Patient Display ID (BN-YYYY-NNNNNN)
  displayId: varchar('display_id', { length: 50 }).unique(),

  // Patient Demographics
  birthDate: varchar('birth_date', { length: 50 }), // DATE stored as string
  gender: varchar('gender', { length: 20 }),
  address: text('address'),

  // Medical Information
  medicalHistory: text('medical_history'),
  allergies: text('allergies'),
  bloodType: varchar('blood_type', { length: 10 }),

  // HIS Integration
  externalPatientId: varchar('external_patient_id', { length: 100 }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
