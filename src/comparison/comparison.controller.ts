import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { ComparisonService } from './comparison.service';
import type { SubmitComparisonDto } from './dto/comparison.dto';

@Controller('comparison')
export class ComparisonController {
    constructor(private readonly comparisonService: ComparisonService) { }

    /**
     * POST /comparison/submit
     * Submit AI vs Doctor comparison for analysis
     */
    @Post('submit')
    async submitComparison(@Body() body: SubmitComparisonDto) {
        try {
            if (!body.aiResults || !body.doctorResults) {
                throw new HttpException(
                    { error: 'Missing aiResults or doctorResults' },
                    HttpStatus.BAD_REQUEST,
                );
            }

            const result = await this.comparisonService.submitComparison(body);

            return {
                success: true,
                ...result,
            };
        } catch (error) {
            console.error('❌ Comparison API Error:', error);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                {
                    error: 'Internal Server Error',
                    details: error instanceof Error ? error.message : 'Unknown error',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * GET /comparison/session/:sessionId
     * Get comparison record for a session
     */
    @Get('session/:sessionId')
    async getComparison(@Param('sessionId') sessionId: string) {
        try {
            if (!sessionId) {
                throw new HttpException(
                    { success: false, error: 'Session ID is required' },
                    HttpStatus.BAD_REQUEST,
                );
            }

            const comparison =
                await this.comparisonService.getComparisonBySession(sessionId);

            return {
                success: true,
                comparison,
            };
        } catch (error) {
            console.error('❌ Error fetching comparison:', error);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                { success: false, error: 'Internal server error' },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
