import { Injectable } from '@nestjs/common';
import {
  ollamaChat,
  OLLAMA_MODEL_LIGHT,
} from '../agents/models/ollama.models';
import { TranscriptSegment, ProcessedSegment } from './dto/stt-response.dto';

/**
 * Extract JSON from LLM response, handling markdown code blocks
 */
function extractJSON(text: string): string {
  let cleaned = text.trim();
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }
  return cleaned;
}

@Injectable()
export class SttService {
  /**
   * Call local Faster-Whisper server to transcribe audio to text
   */
  async transcribeWithWhisper(
    audioBlob: Buffer,
  ): Promise<{ text: string; segments: TranscriptSegment[] }> {
    const whisperUrl = process.env.WHISPER_BASE_URL || 'http://localhost:8080';
    const whisperLang = process.env.WHISPER_LANGUAGE || 'vi';

    const formData = new FormData();
    const uint8Array = new Uint8Array(audioBlob);
    const blob = new Blob([uint8Array], { type: 'audio/wav' });
    formData.append('file', blob, 'recording.wav');
    formData.append('language', whisperLang);
    formData.append('diarize', 'true'); // Enable diarization

    const response = await fetch(`${whisperUrl}/inference`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`WhisperX API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      text: data.text || '',
      segments: data.segments || [],
    };
  }

  /**
   * Convert transcription segments to format for LLM role detection
   * Uses speaker labels from WhisperX as initial hints
   */
  prepareSegmentsForRoleDetection(transcription: {
    text: string;
    segments: TranscriptSegment[];
  }): { role: string; raw_text: string; start: number; end: number }[] {
    if (transcription.segments.length > 0) {
      return transcription.segments.map((seg) => ({
        role: seg.speaker || 'Người nói', // Use WhisperX speaker label if available
        raw_text: seg.text,
        start: seg.start,
        end: seg.end,
      }));
    }

    // Fallback if no segments
    if (transcription.text) {
      return [
        {
          role: 'Người nói',
          raw_text: transcription.text,
          start: 0,
          end: 0,
        },
      ];
    }

    return [];
  }

  /**
   * Use Ollama LLM to analyze content and detect speaker roles
   * Based on conversation context to determine who is Doctor vs Patient
   */
  async detectSpeakerRoleByContent(
    segments: { role: string; raw_text: string; start: number; end: number }[],
  ): Promise<{ role: string; raw_text: string; start: number; end: number }[]> {
    if (segments.length === 0) return segments;

    // Create prompt with all segments
    const conversationText = segments
      .map((seg, i) => `[${i}] "${seg.raw_text.trim()}"`)
      .join('\n');

    // Simplified prompt for better JSON output with Qwen3
    const prompt = `/no_think
Phân loại vai trò cho mỗi đoạn hội thoại y khoa:
${conversationText}

Quy tắc: Bác sĩ = hỏi/chẩn đoán/kê thuốc. Bệnh nhân = mô tả triệu chứng/trả lời.
Trả về JSON: {"roles": ["Bác sĩ", "Bệnh nhân", ...]}`;

    try {
      console.log(`🔍 Analyzing speaker roles with Ollama (${OLLAMA_MODEL_LIGHT})...`);

      // Use JSON mode for structured output
      const completion = await ollamaChat({
        messages: [{ role: 'user', content: prompt }],
        model: OLLAMA_MODEL_LIGHT,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      console.log('LLM response:', responseText.substring(0, 200));

      // Parse JSON response (handle markdown code blocks)
      let roles: string[] = [];
      try {
        const jsonContent = extractJSON(responseText);
        const parsed = JSON.parse(jsonContent);
        roles = parsed.roles || [];
      } catch {
        console.warn('LLM did not return valid JSON, keeping original roles');
        return segments;
      }

      if (roles.length === 0) {
        console.warn('Empty roles array, keeping original roles');
        return segments;
      }

      // Update segments with new roles from LLM
      const updatedSegments = segments.map((seg, i) => {
        const newRole = roles[i] || seg.role;
        if (newRole !== seg.role) {
          console.log(`   [${i}] ${seg.role} → ${newRole}`);
        }
        return { ...seg, role: newRole };
      });

      console.log('✅ LLM role detection completed');
      return updatedSegments;
    } catch (error) {
      console.error('❌ LLM role detection error:', error);
      // Fallback: keep original roles
      return segments;
    }
  }

  /**
   * Use Ollama LLM to fix medical terminology errors quickly
   * ONLY fixes typos, does NOT add new content
   */
  async fixMedicalText(text: string): Promise<string> {
    if (!text || text.trim().length === 0) return text;

    try {
      // Simple prompt with /no_think to disable Qwen3 thinking mode
      const prompt = `/no_think
Sửa lỗi chính tả y khoa trong câu sau (chỉ trả về câu đã sửa, không giải thích):
"${text}"`;

      const completion = await ollamaChat({
        messages: [{ role: 'user', content: prompt }],
        model: OLLAMA_MODEL_LIGHT,
        temperature: 0.05,
      });

      let result = completion.choices[0]?.message?.content || text;

      // Clean up LaTeX/markdown artifacts from Qwen3 thinking mode
      result = this.cleanLLMOutput(result);

      return result;
    } catch (error) {
      console.error('❌ Medical fixer error:', error);
      return text;
    }
  }

  /**
   * Clean LaTeX and markdown artifacts from LLM output
   */
  private cleanLLMOutput(text: string): string {
    return text
      .replace(/\$\$[\s\S]*?\$\$/g, '')  // Remove $$ ... $$
      .replace(/\\boxed\{([^}]*)\}/g, '$1')  // Extract content from \boxed{}
      .replace(/```[\s\S]*?```/g, '')  // Remove code blocks
      .replace(/^[\s\n]+|[\s\n]+$/g, '')  // Trim
      .replace(/^["']|["']$/g, '');  // Remove quotes
  }

  /**
   * Process items with limited concurrency to avoid overwhelming Ollama
   */
  private async processWithConcurrency<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    maxConcurrent: number = 3,
  ): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += maxConcurrent) {
      const batch = items.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
    }
    return results;
  }

  /**
   * Main processing method - orchestrates entire STT pipeline
   * Flow: Whisper STT → LLM Role Detection → Medical Text Fixer
   */
  async processAudioFile(audioBuffer: Buffer): Promise<{
    success: boolean;
    segments: ProcessedSegment[];
    raw_text: string;
    num_speakers: number;
  }> {
    try {
      console.log(`🎤 Received audio: ${audioBuffer.length} bytes`);

      // Step 1: Whisper STT - Convert audio to text (Local faster-whisper server)
      console.log('🔊 Running Whisper STT...');
      const transcription = await this.transcribeWithWhisper(audioBuffer);
      console.log(
        `📝 Transcription: ${transcription.text.substring(0, 100)}...`,
      );
      console.log(`📊 Segments count: ${transcription.segments.length}`);

      // If no text, return empty
      if (!transcription.text || transcription.text.trim().length === 0) {
        return {
          success: true,
          segments: [],
          raw_text: '',
          num_speakers: 0,
        };
      }

      // Step 2: Prepare segments for role detection
      const preparedSegments =
        this.prepareSegmentsForRoleDetection(transcription);
      console.log(`✅ Prepared segments: ${preparedSegments.length}`);

      // Step 3: LLM Role Detection - Analyze content to determine Doctor/Patient
      // With graceful fallback if timeout occurs
      let segmentsWithRoles = preparedSegments;
      try {
        segmentsWithRoles = await this.detectSpeakerRoleByContent(preparedSegments);
        console.log('✅ Role detection completed');
      } catch (error) {
        console.warn('⚠️ Role detection timeout/error, using fallback roles');
        // Fallback: keep original roles as-is
      }

      // Step 4: Map to ProcessedSegment (skip Medical Fixer for speed)
      // SOAP Agent will handle text cleanup when generating the report
      const processedSegments: ProcessedSegment[] = segmentsWithRoles.map(
        (seg) => ({
          ...seg,
          clean_text: seg.raw_text, // Use raw text directly (SOAP will clean)
        }),
      );

      console.log('✅ Processing complete!');

      return {
        success: true,
        segments: processedSegments,
        raw_text: transcription.text,
        num_speakers: 2, // Assumed 2 speakers (Doctor + Patient)
      };
    } catch (error) {
      console.error('❌ Processing error:', error);
      throw error;
    }
  }
}
