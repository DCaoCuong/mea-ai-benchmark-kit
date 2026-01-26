import { Injectable } from '@nestjs/common';
import { eq, isNull, and } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { users } from '../database/schema/user.schema';
import { PatientService } from '../patient/patient.service';

@Injectable()
export class AdminService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly patientService: PatientService,
    ) { }

    /**
     * Update all patients without displayId
     * Admin utility for database maintenance
     */
    async updateAllDisplayIds() {
        const db = this.databaseService.getDatabase();

        console.log('🔍 Finding patients without displayId...');

        // Get all patients without displayId
        const patientsWithoutDisplayId = await db
            .select()
            .from(users)
            .where(and(eq(users.role, 'patient'), isNull(users.displayId)));

        console.log(
            `📋 Found ${patientsWithoutDisplayId.length} patients without displayId`,
        );

        if (patientsWithoutDisplayId.length === 0) {
            return {
                success: true,
                message: 'All patients already have displayId',
                updated: 0,
                patients: [],
            };
        }

        const updatedPatients: Array<{
            id: string;
            name: string;
            email: string;
            displayId: string;
        }> = [];

        // Update each patient with a new displayId
        for (const patient of patientsWithoutDisplayId) {
            const displayId = await this.patientService.generateDisplayId();

            await db
                .update(users)
                .set({ displayId })
                .where(eq(users.id, patient.id));

            updatedPatients.push({
                id: patient.id,
                name: patient.name,
                email: patient.email,
                displayId,
            });

            console.log(
                `✓ Updated patient ${patient.name} (${patient.email}) with displayId: ${displayId}`,
            );
        }

        return {
            success: true,
            message: `Successfully updated ${updatedPatients.length} patients`,
            updated: updatedPatients.length,
            patients: updatedPatients,
        };
    }
}
