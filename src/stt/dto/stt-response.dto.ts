export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface ProcessedSegment {
  start: number;
  end: number;
  role: string;
  raw_text: string;
  clean_text: string;
}

export class SttResponseDto {
  success: boolean;
  segments: ProcessedSegment[];
  raw_text: string;
  num_speakers: number;
}
