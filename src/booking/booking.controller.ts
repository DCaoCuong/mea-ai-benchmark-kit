import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BookingService } from './booking.service';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  /**
   * GET /booking/:bookingId
   * Get booking details by ID
   */
  @Get(':bookingId')
  async getBooking(@Param('bookingId') bookingId: string) {
    try {
      const booking = await this.bookingService.getBookingById(bookingId);

      if (!booking) {
        throw new HttpException(
          { success: false, message: 'Booking not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: booking,
      };
    } catch (error) {
      console.error('❌ Error fetching booking:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Internal Server Error',
          details: String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /booking/:bookingId/record
   * Get medical record for a booking
   */
  @Get(':bookingId/record')
  async getMedicalRecord(@Param('bookingId') bookingId: string) {
    try {
      if (!bookingId) {
        throw new HttpException(
          { success: false, message: 'Booking ID is required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const data =
        await this.bookingService.getMedicalRecordByBookingId(bookingId);

      if (!data) {
        throw new HttpException(
          {
            success: false,
            message: 'Không tìm thấy bệnh án cho booking này',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: {
          booking: data.booking,
          session: data.session,
          medicalRecord: {
            ...data.medicalRecord,
            icdCodes: data.medicalRecord.icdCodes || [],
          },
        },
      };
    } catch (error) {
      console.error('❌ Error fetching medical record:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        { success: false, message: 'Lỗi server khi lấy bệnh án' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
