import { IsString, IsNotEmpty } from 'class-validator';

export class AnalyzeTranscriptDto {
    @IsString()
    @IsNotEmpty()
    transcript: string;
}

export class AnalyzeResponseDto {
    success: boolean;
    data: {
        soap: any;
        icdCodes: string[];
        medicalAdvice: string;
        references: any[];
    };
}