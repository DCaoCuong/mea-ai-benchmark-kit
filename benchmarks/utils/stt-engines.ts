/**
 * STT Engines Client Wrapper
 * Handles different engines: WhisperX, Moonshine, Parakeet
 * 
 * For LOCAL benchmarking: uses /inference-local endpoint (sends file path, no upload)
 * For PRODUCTION: uses /inference endpoint (file upload via multipart)
 */
import * as fs from 'fs';
import * as path from 'path';
import { SttCallMetrics } from '../types';
import { BenchmarkTimer } from './timer';
import { WHISPER_BASE_URL } from '../config/models';

export interface SttEngineOptions {
    audioPath: string;
    language?: string;
    diarization?: boolean;
}

export abstract class SttEngine {
    abstract name: string;
    abstract variant: string;
    abstract category: string;

    abstract transcribe(options: SttEngineOptions): Promise<SttCallMetrics>;
    abstract isHealthy(): Promise<boolean>;
}

// ─── WhisperX Engine (Port 8080) ───
export class WhisperXEngine extends SttEngine {
    name = 'whisperx';
    category = 'whisperx';
    variant: string;

    constructor(variant: string = 'small') {
        super();
        this.variant = variant;
    }

    async transcribe(options: SttEngineOptions): Promise<SttCallMetrics> {
        const timer = new BenchmarkTimer();
        timer.begin();

        try {
            // Resolve to absolute path
            const absolutePath = path.resolve(options.audioPath);
            
            if (!fs.existsSync(absolutePath)) {
                throw new Error(`Audio file not found: ${absolutePath}`);
            }

            // Use LOCAL endpoint - server reads file directly from disk
            // No multipart upload needed = no encoding issues!
            const response = await fetch(`${WHISPER_BASE_URL}/inference-local`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_path: absolutePath,
                    language: options.language || 'vi',
                    diarize: options.diarization ?? true
                })
            });

            const latencyMs = timer.end();
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            return {
                engine: this.name,
                variant: this.variant,
                transcribedText: data.text || '',
                latencyMs,
                audioDurationMs: data.meta?.process_time ? Math.round(data.meta.process_time * 1000) : 0,
                rtf: 0,
                diarizationAvailable: !!data.segments?.some((s: any) => s.speaker),
                segments: data.segments,
            };
        } catch (err) {
            return {
                engine: this.name, variant: this.variant, transcribedText: '', 
                latencyMs: timer.end(), audioDurationMs: 0, rtf: 0, diarizationAvailable: false,
                error: err instanceof Error ? err.message : String(err)
            };
        }
    }

    async isHealthy(): Promise<boolean> {
        try {
            const resp = await fetch(`${WHISPER_BASE_URL}/health`);
            return resp.ok;
        } catch { return false; }
    }
}

// ─── Moonshine Engine (Port 8081) ───
export class MoonshineEngine extends SttEngine {
    name = 'moonshine';
    category = 'moonshine';
    variant: string;

    constructor(variant: string = 'tiny') {
        super();
        this.variant = variant;
    }

    async transcribe(options: SttEngineOptions): Promise<SttCallMetrics> {
        const timer = new BenchmarkTimer();
        timer.begin();

        try {
            const absolutePath = path.resolve(options.audioPath);
            if (!fs.existsSync(absolutePath)) {
                throw new Error(`Audio file not found: ${absolutePath}`);
            }

            // Moonshine also uses local file path
            const response = await fetch(`http://localhost:8081/inference-local`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_path: absolutePath,
                    language: options.language || 'vi'
                })
            });

            const latencyMs = timer.end();
            if (!response.ok) throw new Error(`Moonshine Server Error: ${response.status}`);

            const data = await response.json();
            let text = data.text || '';
            if (Array.isArray(text)) text = text.join(' ');
            if (typeof text !== 'string') text = String(text);

            return {
                engine: this.name, variant: this.variant,
                transcribedText: text,
                latencyMs, audioDurationMs: 0, rtf: 0, diarizationAvailable: false,
            };
        } catch (err) {
            return {
                engine: this.name, variant: this.variant, transcribedText: '', 
                latencyMs: timer.end(), audioDurationMs: 0, rtf: 0, diarizationAvailable: false,
                error: err instanceof Error ? err.message : String(err)
            };
        }
    }

    async isHealthy(): Promise<boolean> { return false; }
}

// ─── Parakeet Engine (Port 8082) ───
export class ParakeetEngine extends SttEngine {
    name = 'parakeet';
    category = 'parakeet';
    variant: string;

    constructor(variant: string = 'ctc-0.6b-vi') {
        super();
        this.variant = variant;
    }

    async transcribe(options: SttEngineOptions): Promise<SttCallMetrics> {
        const timer = new BenchmarkTimer();
        timer.begin();

        try {
            const absolutePath = path.resolve(options.audioPath);
            if (!fs.existsSync(absolutePath)) {
                throw new Error(`Audio file not found: ${absolutePath}`);
            }

            // Parakeet also uses local file path
            const response = await fetch(`http://localhost:8082/inference-local`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_path: absolutePath,
                    language: options.language || 'vi'
                })
            });

            const latencyMs = timer.end();
            if (!response.ok) throw new Error(`Parakeet Server Error: ${response.status}`);

            const data = await response.json();
            let text = data.text || '';
            if (Array.isArray(text)) text = text.join(' ');
            if (typeof text !== 'string') text = String(text);

            return {
                engine: this.name, variant: this.variant,
                transcribedText: text,
                latencyMs, audioDurationMs: 0, rtf: 0, diarizationAvailable: false,
            };
        } catch (err) {
            return {
                engine: this.name, variant: this.variant, transcribedText: '', 
                latencyMs: timer.end(), audioDurationMs: 0, rtf: 0, diarizationAvailable: false,
                error: err instanceof Error ? err.message : String(err)
            };
        }
    }

    async isHealthy(): Promise<boolean> { return false; }
}

// ─── WhisperLiveKit Engine (Port 8083) ───
export class WhisperLiveEngine extends SttEngine {
    name = 'whisperlive';
    category = 'whisperlive';
    variant: string;

    constructor(variant: string = 'small') {
        super();
        this.variant = variant;
    }

    async transcribe(options: SttEngineOptions): Promise<SttCallMetrics> {
        const timer = new BenchmarkTimer();
        timer.begin();

        try {
            const absolutePath = path.resolve(options.audioPath);
            if (!fs.existsSync(absolutePath)) {
                throw new Error(`Audio file not found: ${absolutePath}`);
            }

            const response = await fetch(`http://localhost:8083/inference-local`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_path: absolutePath,
                    language: options.language || 'vi',
                    model_size: this.variant
                })
            });

            const latencyMs = timer.end();
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`WhisperLive Server Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            let text = data.text || '';
            if (Array.isArray(text)) text = text.join(' ');
            if (typeof text !== 'string') text = String(text);

            return {
                engine: this.name, variant: this.variant,
                transcribedText: text,
                latencyMs, audioDurationMs: 0, rtf: 0, diarizationAvailable: false,
            };
        } catch (err) {
            return {
                engine: this.name, variant: this.variant, transcribedText: '', 
                latencyMs: timer.end(), audioDurationMs: 0, rtf: 0, diarizationAvailable: false,
                error: err instanceof Error ? err.message : String(err)
            };
        }
    }

    async isHealthy(): Promise<boolean> { return false; }
}

// ─── Mock Engine ───
export class MockSttEngine extends SttEngine {
    name = 'mock-stt';
    variant = 'base';
    category = 'mock';

    async transcribe(options: SttEngineOptions): Promise<SttCallMetrics> {
        const timer = new BenchmarkTimer();
        timer.begin();
        await new Promise(r => setTimeout(r, 100));
        return {
            engine: this.name, variant: this.variant,
            transcribedText: "Mock result.", latencyMs: timer.end(),
            audioDurationMs: 5000, rtf: 0.1, diarizationAvailable: false,
        };
    }
    async isHealthy(): Promise<boolean> { return true; }
}
