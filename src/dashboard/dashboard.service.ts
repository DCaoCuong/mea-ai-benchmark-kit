import { Injectable } from '@nestjs/common';
import { gte, desc, sql, eq, and } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { bookings } from '../database/schema/booking.schema';
import {
    examinationSessions,
    medicalRecords,
} from '../database/schema/session.schema';

@Injectable()
export class DashboardService {
    constructor(private readonly databaseService: DatabaseService) { }

    /**
     * Get dashboard statistics
     */
    async getDashboardStats() {
        const db = this.databaseService.getDatabase();
        const now = new Date();

        // Calculate date boundaries
        const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
        );
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Today's sessions
        const todaySessions = await db
            .select()
            .from(examinationSessions)
            .where(gte(examinationSessions.createdAt, todayStart));

        const todayCompleted = todaySessions.filter(
            (s) => s.status === 'completed',
        ).length;
        const todayActive = todaySessions.filter(
            (s) => s.status === 'active',
        ).length;

        // This week's sessions
        const weekSessions = await db
            .select()
            .from(examinationSessions)
            .where(gte(examinationSessions.createdAt, weekStart));

        // This week's new bookings
        const weekNewBookings = await db
            .select()
            .from(bookings)
            .where(gte(bookings.createdAt, weekStart));

        // This month's sessions
        const monthSessions = await db
            .select()
            .from(examinationSessions)
            .where(gte(examinationSessions.createdAt, monthStart));

        // This month's new bookings
        const monthNewBookings = await db
            .select()
            .from(bookings)
            .where(gte(bookings.createdAt, monthStart));

        // Total counts
        const totalBookingsResult = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(bookings);

        const totalSessionsResult = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(examinationSessions);

        return {
            today: {
                totalSessions: todaySessions.length,
                completedSessions: todayCompleted,
                activeSessions: todayActive,
            },
            thisWeek: {
                totalSessions: weekSessions.length,
                newBookings: weekNewBookings.length,
            },
            thisMonth: {
                totalSessions: monthSessions.length,
                newBookings: monthNewBookings.length,
            },
            total: {
                bookings: totalBookingsResult[0]?.count || 0,
                sessions: totalSessionsResult[0]?.count || 0,
            },
        };
    }

    /**
     * Get list of bookings with summary info
     * Only shows paid/confirmed bookings that are still valid
     */
    async getBookingsList(limit: number = 50, page: number = 1) {
        const db = this.databaseService.getDatabase();
        const offset = (page - 1) * limit;

        // Calculate start of today
        const now = new Date();
        const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
        );

        // Get bookings that are paid/confirmed and still valid
        const paidStatuses = ['paid', 'confirmed', 'approved'];

        const bookingsList = await db
            .select()
            .from(bookings)
            .where(
                and(
                    sql`${bookings.status} = ANY(ARRAY[${sql.join(paidStatuses.map((s) => sql`${s}`), sql`, `)}])`,
                    gte(bookings.bookingTime, todayStart),
                ),
            )
            .orderBy(desc(bookings.bookingTime))
            .limit(limit)
            .offset(offset);

        // For each booking, check if there's an associated session
        const bookingsWithSummary = await Promise.all(
            bookingsList.map(async (booking: any) => {
                const session = await db
                    .select({
                        id: examinationSessions.id,
                        status: examinationSessions.status,
                    })
                    .from(examinationSessions)
                    .where(eq(examinationSessions.bookingId, booking.id))
                    .orderBy(desc(examinationSessions.createdAt))
                    .limit(1);

                return {
                    id: booking.id,
                    displayId: booking.displayId,
                    patientName: booking.patientName,
                    patientPhone: booking.patientPhone,
                    age: booking.age,
                    gender: booking.gender,
                    symptoms: booking.symptoms,
                    bookingTime: booking.bookingTime,
                    status: booking.status,
                    hasSession: session.length > 0,
                    sessionStatus: session[0]?.status || null,
                };
            }),
        );

        return bookingsWithSummary;
    }
}
