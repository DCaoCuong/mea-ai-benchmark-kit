import {
    Controller,
    Get,
    Post,
    Query,
    Param,
    Body,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { HisService } from './his.service';
import type { UpdateVisitDto } from './dto/his.dto';

@Controller('his')
export class HisController {
    constructor(private readonly hisService: HisService) { }

    /**
     * GET /his/current-session?context=true
     * Get current session data from HIS system (MOCK)
     */
    @Get('current-session')
    async getCurrentSession(@Query('context') contextParam?: string) {
        try {
            const includeContext = contextParam === 'true';
            const result = await this.hisService.getCurrentSession(includeContext);
            return result;
        } catch (error) {
            console.error('❌ HIS getCurrentSession error:', error);

            throw new HttpException(
                {
                    success: false,
                    error: 'Failed to fetch session data from HIS system',
                    details: error instanceof Error ? error.message : 'Unknown error',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * POST /his/update/:visitId
     * Update visit record in HIS system (MOCK)
     */
    @Post('update/:visitId')
    async updateVisit(
        @Param('visitId') visitId: string,
        @Body() payload: UpdateVisitDto,
    ) {
        try {
            const result = await this.hisService.updateVisit(visitId, payload);

            if (!result.success) {
                // Return appropriate status based on error
                const status =
                    result.error === 'HIS system temporarily unavailable'
                        ? HttpStatus.SERVICE_UNAVAILABLE
                        : HttpStatus.BAD_REQUEST;

                throw new HttpException(result, status);
            }

            return result;
        } catch (error) {
            console.error('❌ HIS updateVisit error:', error);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                {
                    success: false,
                    error: 'Internal server error',
                    details: error instanceof Error ? error.message : 'Unknown error',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
