import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';

/**
 * Bookings Table (from Booking Clinic system)
 * This is the main table for patient appointments in the integrated system
 * MEA will use this table to display and manage patient examinations
 */
export const bookings = pgTable('bookings', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),

  // MEA Display ID (auto-generated: BK-YYYY-NNNNNN)
  displayId: text('display_id').unique(),

  // Patient Information
  patientName: text('patient_name').notNull(),
  patientPhone: text('patient_phone').notNull(),
  gender: text('gender'),
  age: integer('age'),
  symptoms: text('symptoms'),

  // Medical Information (optional - added for MEA)
  address: text('address'),
  medicalHistory: text('medical_history'),
  allergies: text('allergies'),
  bloodType: varchar('blood_type', { length: 10 }),

  // Scheduling
  bookingTime: timestamp('booking_time').notNull(),

  // Assignment
  doctorId: uuid('doctor_id'),
  assignedBy: uuid('assigned_by'),
  staffNote: text('staff_note'),

  // Status: pending | confirmed | in_progress | completed | cancelled
  status: varchar('status', { length: 50 }).default('pending'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Type exports
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
