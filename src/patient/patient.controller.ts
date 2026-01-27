import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import type {
  CreatePatientRequestDto,
  PatientListQuery,
} from './dto/patient.dto';

@Controller()
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  /**
   * GET /patients
   * List or search patients with pagination
   */
  @Get('patients')
  async listPatients(@Query() query: PatientListQuery) {
    try {
      const page = query.page ? parseInt(String(query.page), 10) : 1;
      const limit = query.limit ? parseInt(String(query.limit), 10) : 20;

      // Search mode
      if (query.q || query.search) {
        const searchQuery = (query.q || query.search) as string;
        const result = await this.patientService.searchPatients(searchQuery, {
          page,
          limit,
        });
        return result;
      }

      // List mode
      const result = await this.patientService.listPatients({ page, limit });
      return result;
    } catch (error) {
      console.error('❌ Error in patients list API:', error);
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
   * POST /patient/create
   * Create new patient with duplicate detection
   */
  @Post('patient/create')
  async createPatient(@Body() body: CreatePatientRequestDto) {
    try {
      const { patientData, force } = body;

      // Validate required fields
      if (!patientData.name) {
        throw new HttpException(
          { error: 'Patient name is required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.patientService.createPatient(
        patientData,
        force,
      );

      if (!result.success) {
        throw new HttpException(
          {
            success: false,
            error: result.error,
            duplicates: result.duplicates,
          },
          HttpStatus.CONFLICT, // 409 Conflict for duplicates
        );
      }

      return {
        success: true,
        patient: result.patient,
      };
    } catch (error) {
      console.error('❌ Error in patient create API:', error);

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
   * GET /patient/:patientId
   * Get patient details by ID
   */
  @Get('patient/:patientId')
  async getPatient(@Param('patientId') patientId: string) {
    try {
      const patient = await this.patientService.getPatientById(patientId);

      if (!patient) {
        throw new HttpException(
          { error: 'Patient not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        patient,
      };
    } catch (error) {
      console.error('❌ Error in patient get API:', error);

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
   * GET /patient/:patientId/sessions
   * Get all examination sessions for a patient
   */
  @Get('patient/:patientId/sessions')
  async getPatientSessions(@Param('patientId') patientId: string) {
    try {
      const result = await this.patientService.getPatientSessions(patientId);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('❌ Error in patient sessions API:', error);

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
