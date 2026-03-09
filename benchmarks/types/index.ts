/**
 * Benchmark Types
 * Shared type definitions for all benchmark tasks
 */

// ─── LLM Benchmark Types ───

export interface LlmCallMetrics {
    model: string;
    content: string;
    latencyMs: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    jsonCompliant: boolean;
    error?: string;
}

export interface BenchmarkRunResult {
    runIndex: number;
    timestamp: string;
    metrics: LlmCallMetrics;
}

export interface TaskBenchmarkResult {
    taskName: string;
    model: string;
    scenarioId: string;
    scenarioName: string;
    runs: BenchmarkRunResult[];
    summary: {
        avgLatencyMs: number;
        minLatencyMs: number;
        maxLatencyMs: number;
        avgPromptTokens: number;
        avgCompletionTokens: number;
        jsonComplianceRate: number; // 0-100%
        errorRate: number; // 0-100%
        accuracyScore?: number; // 0-100, task-specific
    };
}

// ─── STT Benchmark Types ───

export interface SttEngineInfo {
    name: string;
    variant: string;
    category: 'whisperx' | 'whisper-v3' | 'moonshine' | 'parakeet';
    vram: string;
}

export interface SttCallMetrics {
    engine: string;
    variant: string;
    transcribedText: string;
    latencyMs: number;
    audioDurationMs: number;
    rtf: number; // Real-Time Factor: latency / duration
    wer?: number; // Word Error Rate (0-1)
    medicalTermAccuracy?: number; // 0-100%
    diarizationAvailable: boolean;
    segments?: Array<{
        text: string;
        start: number;
        end: number;
        speaker?: string;
    }>;
    error?: string;
}

export interface SttBenchmarkResult {
    engine: string;
    variant: string;
    scenarioId: string;
    scenarioName: string;
    runs: Array<{
        runIndex: number;
        timestamp: string;
        metrics: SttCallMetrics;
    }>;
    summary: {
        avgLatencyMs: number;
        avgRtf: number;
        avgWer: number;
        avgMedicalTermAccuracy: number;
        errorRate: number;
    };
}

// ─── Embedding Benchmark Types ───

export interface EmbeddingCallMetrics {
    model: string;
    latencyMs: number;
    dimensions: number;
    error?: string;
}

export interface EmbeddingSimilarityResult {
    model: string;
    pairType: 'similar' | 'different';
    textA: string;
    textB: string;
    similarity: number; // 0-1 cosine similarity
    latencyMs: number;
}

export interface EmbeddingBenchmarkResult {
    model: string;
    avgEmbedSpeedMs: number;
    avgSimilarPairScore: number;
    avgDifferentPairScore: number;
    separationRatio: number;
    retrievalMrr?: number; // Mean Reciprocal Rank
}

// ─── Report Types ───

export interface BenchmarkReport {
    id: string;
    type: 'llm' | 'stt' | 'embedding';
    createdAt: string;
    hardware: {
        cpu: string;
        ram: string;
        gpu: string;
        vram: string;
    };
    results: TaskBenchmarkResult[] | SttBenchmarkResult[] | EmbeddingBenchmarkResult[];
}

// ─── Config Types ───

export interface ModelCandidate {
    name: string;
    category: 'light' | 'standard' | 'expert';
    vram: string;
    params?: string;
    notes?: string;
}

export interface SttCandidate {
    engine: string;
    variant: string;
    category: 'whisperx' | 'whisper-v3' | 'moonshine' | 'parakeet';
    vram: string;
    params?: string;
    hasDiarization: boolean;
    hasPunctuation: boolean;
    notes?: string;
}

export interface EmbeddingCandidate {
    name: string;
    dimensions: number;
    size: string;
}

export interface TaskDefinition {
    name: string;
    description: string;
    promptTemplate: string;
    expectedOutputFormat: 'json' | 'text';
    scoringMetric: string;
}
