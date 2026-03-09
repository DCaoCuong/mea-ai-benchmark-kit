/**
 * Model Registry - All candidate models for benchmarking
 */
import { ModelCandidate, SttCandidate, EmbeddingCandidate } from '../types/index';

// ─── LLM Models (Ollama) ───

export const LLM_CANDIDATES: ModelCandidate[] = [
    // Light models (< 2B params) - fast, lower accuracy
    { name: 'gemma2:2b', category: 'light', vram: '1.5GB', params: '2B', notes: 'Currently used as OLLAMA_MODEL_LIGHT' },
    { name: 'qwen3:1.7b', category: 'light', vram: '1.2GB', params: '1.7B', notes: 'Strong multilingual, very small' },
    { name: 'llama3.2:1b', category: 'light', vram: '0.8GB', params: '1B', notes: 'Smallest viable model' },

    // Standard models (3-4B params) - balanced
    { name: 'qwen3:4b', category: 'standard', vram: '2.5GB', params: '4B', notes: 'Best Vietnamese, thinking mode with /no_think' },
    { name: 'gemma3:4b', category: 'standard', vram: '2.5GB', params: '4B', notes: 'Good balance quality/speed' },
    { name: 'phi3:3.8b', category: 'standard', vram: '2.3GB', params: '3.8B', notes: 'Good reasoning' },
    { name: 'phi4-mini:3.8b', category: 'standard', vram: '2.3GB', params: '3.8B', notes: 'Newer Phi4 release' },
    { name: 'llama3.2:3b', category: 'standard', vram: '2GB', params: '3B', notes: 'Good instruction following' },

    // Expert models (7B+) - best accuracy, needs more VRAM
    // { name: 'mistral:7b', category: 'expert', vram: '4GB', params: '7B', notes: 'May not fit in 4GB VRAM' },
];

// ─── STT Models (Multi-engine) ───

export const STT_CANDIDATES: SttCandidate[] = [
    // Engine A: WhisperX (current)
    { engine: 'whisperx', variant: 'tiny', category: 'whisperx', vram: '1GB', params: '39M', hasDiarization: true, hasPunctuation: false, notes: 'Fastest, lowest accuracy' },
    { engine: 'whisperx', variant: 'base', category: 'whisperx', vram: '1GB', params: '74M', hasDiarization: true, hasPunctuation: false },
    { engine: 'whisperx', variant: 'small', category: 'whisperx', vram: '2GB', params: '244M', hasDiarization: true, hasPunctuation: false, notes: 'Currently used' },
    { engine: 'whisperx', variant: 'medium', category: 'whisperx', vram: '4GB', params: '769M', hasDiarization: true, hasPunctuation: false, notes: 'Max quality for 4GB VRAM' },

    // Engine B: Whisper-large-v3
    { engine: 'whisper-v3', variant: 'large-v3-turbo', category: 'whisper-v3', vram: '4GB', params: '809M', hasDiarization: false, hasPunctuation: false, notes: 'Might fit 4GB VRAM (tight)' },
    { engine: 'whisper-v3', variant: 'large-v3', category: 'whisper-v3', vram: '6GB+', params: '1.55B', hasDiarization: false, hasPunctuation: false, notes: 'Too large for local, use Groq API for reference' },

    // Engine C: Moonshine Voice
    { engine: 'moonshine', variant: 'moonshine-tiny', category: 'moonshine', vram: '<1GB', params: '~26M', hasDiarization: false, hasPunctuation: false, notes: '5x faster than Whisper, <8MB RAM' },
    { engine: 'moonshine', variant: 'moonshine-base', category: 'moonshine', vram: '<1GB', params: '~60M', hasDiarization: false, hasPunctuation: false, notes: 'Production-grade edge' },

    // Engine D: Parakeet-CTC Vietnamese
    { engine: 'parakeet', variant: 'parakeet-ctc-0.6b-vi', category: 'parakeet', vram: '2GB', params: '600M', hasDiarization: false, hasPunctuation: true, notes: 'Vietnamese-specialized, WER 6-11% on Vi benchmarks' },
];

// ─── Embedding Models (Ollama) ───

export const EMBEDDING_CANDIDATES: EmbeddingCandidate[] = [
    { name: 'nomic-embed-text-v2-moe', dimensions: 768, size: '280MB' },
    { name: 'mxbai-embed-large', dimensions: 1024, size: '670MB' },
    { name: 'all-minilm', dimensions: 384, size: '110MB' },
    { name: 'snowflake-arctic-embed', dimensions: 1024, size: '670MB' },
];

// ─── Ollama Config ───

export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
export const WHISPER_BASE_URL = process.env.WHISPER_BASE_URL || 'http://localhost:8080';

// ─── Hardware Info (for reports) ───

export const HARDWARE_INFO = {
    cpu: 'i7-11800H @ 2.30GHz',
    ram: '16GB',
    gpu: 'RTX 3050 Ti',
    vram: '4GB',
};
