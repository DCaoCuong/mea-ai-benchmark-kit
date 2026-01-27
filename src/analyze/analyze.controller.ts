import { Controller, Post, Body } from '@nestjs/common';
import { AnalyzeService } from './analyze.service';
import { AnalyzeTranscriptDto } from '../common/dto/analyze.dto';

@Controller('analyze')
export class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  @Post()
  async analyze(@Body() dto: AnalyzeTranscriptDto) {
    const result = await this.analyzeService.processTranscript(dto.transcript);
    return {
      success: true,
      data: result,
    };
  }
}
