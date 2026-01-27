import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SessionService } from './session.service';
import type { CreateSessionDto } from './dto/session.dto';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  /**
   * POST /session/create
   * Create new examination session
   *
   * Supports 3 methods:
   * 1. bookingId - Primary method (from Booking Clinic)
   * 2. patientId - Legacy method
   * 3. patientName - Legacy method (auto-creates patient)
   */
  @Post('create')
  async createSession(@Body() createSessionDto: CreateSessionDto) {
    try {
      // Method 1: bookingId provided (Primary - NEW)
      if (createSessionDto.bookingId) {
        const session = await this.sessionService.createSessionFromBooking(
          createSessionDto.bookingId,
          createSessionDto.chiefComplaint,
        );

        return {
          success: true,
          message: 'Phiên khám đã được tạo thành công',
          data: session,
        };
      }

      // Method 2: patientId provided (Legacy)
      if (createSessionDto.patientId) {
        const session = await this.sessionService.createSessionFromPatient(
          createSessionDto.patientId,
          createSessionDto.chiefComplaint,
          createSessionDto.visitId,
        );

        return {
          success: true,
          message: 'Phiên khám đã được tạo thành công',
          data: session,
        };
      }

      // Method 3: patientName provided (Legacy - auto-create patient)
      if (createSessionDto.patientName) {
        // Note: This would require UserService integration
        // For now, return error indicating this method needs implementation
        throw new HttpException(
          {
            success: false,
            error: 'Not Implemented',
            message:
              'Tạo phiên khám từ tên bệnh nhân chưa được triển khai (cần UserService)',
          },
          HttpStatus.NOT_IMPLEMENTED,
        );
      }

      // No valid input
      throw new HttpException(
        {
          success: false,
          error: 'Validation error',
          message: 'Mã booking, tên bệnh nhân hoặc mã bệnh nhân là bắt buộc',
        },
        HttpStatus.BAD_REQUEST,
      );
    } catch (error) {
      console.error('❌ Error creating session:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          error: 'Internal server error',
          message: 'Không thể tạo phiên khám',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /session/:sessionId
   * Get session details with medical record
   */
  @Get(':sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    try {
      if (!sessionId) {
        throw new HttpException(
          {
            success: false,
            error: 'Session ID is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Get session
      const session = await this.sessionService.getSessionById(sessionId);

      if (!session) {
        throw new HttpException(
          {
            success: false,
            error: 'Session not found',
            message: 'Phiên khám không tồn tại',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // Get associated medical record
      const medicalRecord =
        await this.sessionService.getMedicalRecordBySession(sessionId);

      return {
        success: true,
        data: {
          session,
          medicalRecord: medicalRecord || null,
        },
      };
    } catch (error) {
      console.error('❌ Error fetching session:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          error: 'Internal server error',
          message: 'Không thể lấy thông tin phiên khám',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
