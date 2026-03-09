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
import {
  checkOllamaHealth,
  OLLAMA_MODEL_LIGHT,
  OLLAMA_MODEL_STANDARD,
  OLLAMA_MODEL_EXPERT,
  OLLAMA_EMBEDDING_MODEL,
} from '../agents/models/ollama.models';

@Controller('stt')
export class SttController {
  constructor(private readonly sttService: SttService) { }

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
  async healthCheck() {
    const ollamaOk = await checkOllamaHealth();
    const whisperUrl = process.env.WHISPER_BASE_URL || 'http://localhost:8080';

    let whisperOk = false;
    try {
      const res = await fetch(whisperUrl);
      whisperOk = res.ok;
    } catch {
      whisperOk = false;
    }

    return {
      status: ollamaOk && whisperOk ? 'ok' : 'degraded',
      services: {
        whisper_stt: whisperOk ? 'ok' : 'unavailable',
        whisper_url: whisperUrl,
        ollama_llm: ollamaOk ? 'ok' : 'unavailable',
        ollama_models: {
          light: OLLAMA_MODEL_LIGHT,
          standard: OLLAMA_MODEL_STANDARD,
          expert: OLLAMA_MODEL_EXPERT,
          embedding: OLLAMA_EMBEDDING_MODEL,
        },
      },
      note: 'Full local AI: Whisper (STT) + Ollama (Multi-model LLM + Embedding)',
    };
  }
}
