import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SttService } from './stt.service';

@Controller('stt')
export class SttController {
  constructor(private readonly sttService: SttService) {}

  /**
   * Main STT endpoint - Process audio file
   * POST /stt
   */
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async transcribeAudio(@UploadedFile() file: any) {
    if (!file) {
      throw new HttpException('No audio file provided', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.sttService.processAudioFile(file.buffer);
      return result;
    } catch (error) {
      console.error('❌ STT Controller error:', error);
      throw new HttpException(
        {
          error: 'Lỗi xử lý hệ thống',
          details: String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Health check endpoint
   * GET /stt
   */
  @Get()
  healthCheck() {
    return {
      status: 'ok',
      services: {
        groq_stt: process.env.GROQ_API_KEY ? 'configured' : 'missing_key',
        llm_role_detection: 'ready',
        medical_fixer: 'ready',
      },
      note: 'Using LLM Context Analysis for speaker role detection',
    };
  }
}
