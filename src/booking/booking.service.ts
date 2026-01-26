import { Injectable } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { bookings } from '../database/schema/booking.schema';
import { examinationSessions, medicalRecords } from '../database/schema/session.schema';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class BookingService {
    constructor(private readonly databaseService: DatabaseService) { }

    /**
     * Get booking by ID
     */
    async getBookingById(bookingId: string) {
        const db = this.databaseService.getDatabase();

        const result = await db
            .select()
            .from(bookings)
            .where(eq(bookings.id, bookingId))
            .limit(1);

        return result[0] || null;
    }

    /**
     * Get medical record by booking ID
     * Returns booking info, session, and medical record
     */
    async getMedicalRecordByBookingId(bookingId: string) {
        const db = this.databaseService.getDatabase();

        // Get session for this booking
        const sessionResults = await db
            .select({
                session: examinationSessions,
                booking: bookings,
            })
            .from(examinationSessions)
            .leftJoin(bookings, eq(examinationSessions.bookingId, bookings.id))
            .where(eq(examinationSessions.bookingId, bookingId))
            .orderBy(desc(examinationSessions.createdAt))
            .limit(1);

        if (!sessionResults[0] || !sessionResults[0].booking) {
            return null;
        }

        const { session, booking } = sessionResults[0];

        // Get medical record for this session
        const recordResults = await db
            .select()
            .from(medicalRecords)
            .where(eq(medicalRecords.sessionId, session.id))
            .limit(1);

        if (!recordResults[0]) {
            return null;
        }

        return {
            booking: {
                id: booking.id,
                displayId: booking.displayId,
                patientName: booking.patientName,
                patientPhone: booking.patientPhone,
                age: booking.age,
                gender: booking.gender,
                symptoms: booking.symptoms,
                address: booking.address,
                medicalHistory: booking.medicalHistory,
                allergies: booking.allergies,
                bloodType: booking.bloodType,
                bookingTime: booking.bookingTime,
                status: booking.status,
            },
            session: {
                id: session.id,
                visitNumber: session.visitNumber,
                chiefComplaint: session.chiefComplaint,
                status: session.status,
                createdAt: session.createdAt,
            },
            medicalRecord: recordResults[0],
        };
    }
}
