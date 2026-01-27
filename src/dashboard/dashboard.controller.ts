import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/stats
   * Get dashboard statistics with booking list
   */
  @Get('stats')
  async getStats(
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
  ) {
    try {
      const page = pageParam ? parseInt(pageParam, 10) : 1;
      const limit = limitParam ? parseInt(limitParam, 10) : 50;

      const stats = await this.dashboardService.getDashboardStats();
      const bookings = await this.dashboardService.getBookingsList(limit, page);

      return {
        success: true,
        stats,
        bookings,
        patients: bookings,
        pagination: {
          page,
          limit,
        },
      };
    } catch (error) {
      console.error('Error in dashboard stats API:', error);

      throw new HttpException(
        {
          error: 'Internal Server Error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
