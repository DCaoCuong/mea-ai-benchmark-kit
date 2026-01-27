import { Injectable } from '@nestjs/common';
import { MedicalAgentGraphService } from '../agents/graph/medical-agent-graph.service';

@Injectable()
export class AnalyzeService {
  constructor(private readonly medicalAgentGraph: MedicalAgentGraphService) {}

  async processTranscript(transcript: string) {
    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript is required');
    }

    console.log('🔬 Starting Medical Agent Workflow...');

    // Invoke the LangGraph workflow
    const result = await this.medicalAgentGraph.invoke({
      transcript: transcript,
    });

    console.log('✅ Workflow completed!');

    return {
      soap: result.soap,
      icdCodes: result.icdCodes,
      medicalAdvice: result.medicalAdvice,
      references: result.references,
    };
  }
}
