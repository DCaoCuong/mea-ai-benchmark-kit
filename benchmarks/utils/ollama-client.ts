/**
 * Ollama Benchmark Client
 * Wraps Ollama API calls with automatic metrics collection (latency, tokens)
 */
import { BenchmarkTimer } from './timer';
import { LlmCallMetrics } from '../types/index';
import { OLLAMA_BASE_URL } from '../config/models';

interface OllamaChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface OllamaChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: { role: string; content: string };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

/**
 * Call Ollama and collect benchmark metrics
 */
export async function benchmarkOllamaCall(options: {
    model: string;
    messages: OllamaChatMessage[];
    temperature?: number;
    jsonMode?: boolean;
    timeoutMs?: number;
}): Promise<LlmCallMetrics> {
    const {
        model,
        messages,
        temperature = 0.1,
        jsonMode = false,
        timeoutMs = 120_000, // 2 min default
    } = options;

    const requestBody: Record<string, unknown> = {
        model,
        messages,
        temperature,
        stream: false,
    };

    if (jsonMode) {
        requestBody.format = 'json';
    }

    const timer = new BenchmarkTimer();
    timer.begin();

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(timeoutMs),
        });

        const latencyMs = timer.end();

        if (!response.ok) {
            const errorText = await response.text();
            return {
                model,
                content: '',
                latencyMs,
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                jsonCompliant: false,
                error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
            };
        }

        const data: OllamaChatResponse = await response.json();
        const content = data.choices[0]?.message?.content || '';

        // Check JSON compliance if jsonMode was requested
        let jsonCompliant = true;
        if (jsonMode) {
            try {
                JSON.parse(extractJSON(content));
            } catch {
                jsonCompliant = false;
            }
        }

        return {
            model,
            content,
            latencyMs,
            promptTokens: data.usage?.prompt_tokens ?? 0,
            completionTokens: data.usage?.completion_tokens ?? 0,
            totalTokens: data.usage?.total_tokens ?? 0,
            jsonCompliant,
        };
    } catch (err) {
        const latencyMs = timer.end();
        const errorMsg = err instanceof Error ? err.message : String(err);
        return {
            model,
            content: '',
            latencyMs,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            jsonCompliant: false,
            error: errorMsg,
        };
    }
}

/**
 * Check if Ollama server is available
 */
export async function checkOllamaHealth(): Promise<boolean> {
    try {
        const resp = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            signal: AbortSignal.timeout(5000),
        });
        return resp.ok;
    } catch {
        return false;
    }
}

/**
 * List models currently available on Ollama
 */
export async function listOllamaModels(): Promise<string[]> {
    try {
        const resp = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            signal: AbortSignal.timeout(5000),
        });
        if (!resp.ok) return [];
        const data = await resp.json();
        return (data.models || []).map((m: { name: string }) => m.name);
    } catch {
        return [];
    }
}

/**
 * Pre-load a model into Ollama (warm-up)
 */
export async function warmUpModel(model: string): Promise<void> {
    console.log(`  🔥 Warming up ${model}...`);
    await benchmarkOllamaCall({
        model,
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0,
        timeoutMs: 120_000,
    });
    console.log(`  ✅ ${model} ready`);
}

/**
 * Extract JSON from LLM response, handling markdown code blocks
 */
export function extractJSON(text: string): string {
    let cleaned = text.trim();
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
        cleaned = codeBlockMatch[1].trim();
    }
    return cleaned;
}
