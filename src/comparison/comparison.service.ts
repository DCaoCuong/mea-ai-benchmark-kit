import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { comparisonRecords } from '../database/schema/comparison.schema';
import { ComparisonAgentService } from './comparison-agent.service';
import { SubmitComparisonDto } from './dto/comparison.dto';

@Injectable()
export class ComparisonService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly comparisonAgentService: ComparisonAgentService,
    ) { }

    /**
     * Submit comparison for analysis
     */
    async submitComparison(data: SubmitComparisonDto) {
        const db = this.databaseService.getDatabase();

        // Run AI Comparison Analysis
        const analysis = await this.comparisonAgentService.compareMedicalResults(
            data.aiResults.soap,
            data.doctorResults.soap,
            data.aiResults.icdCodes,
            data.doctorResults.icdCodes,
        );

        // Save to Database
        const result = await db
            .insert(comparisonRecords)
            .values({
                sessionId: data.sessionId || null,
                medicalRecordId: data.medicalRecordId || null,
                aiResults: data.aiResults as any,
                doctorResults: data.doctorResults as any,
                comparison: analysis as any,
                matchScore: analysis.matchScore,
            })
            .returning();

        return {
            comparisonId: result[0].id,
            matchScore: analysis.matchScore,
            analysis,
        };
    }

    /**
     * Get comparison record by session ID
     */
    async getComparisonBySession(sessionId: string) {
        const db = this.databaseService.getDatabase();

        const result = await db
            .select()
            .from(comparisonRecords)
            .where(eq(comparisonRecords.sessionId, sessionId))
            .limit(1);

        return result[0] || null;
    }
}
