import { Controller, Post, HttpException, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    /**
     * POST /admin/update-display-ids
     * Update all patients without displayId (Admin utility)
     */
    @Post('update-display-ids')
    async updateDisplayIds() {
        try {
            const result = await this.adminService.updateAllDisplayIds();
            return result;
        } catch (error) {
            console.error('❌ Error updating patients:', error);

            throw new HttpException(
                {
                    success: false,
                    error: 'Failed to update patients',
                    details: error instanceof Error ? error.message : String(error),
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
