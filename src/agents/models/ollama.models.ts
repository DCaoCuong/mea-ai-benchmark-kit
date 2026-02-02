/**
 * Ollama LLM Client - OpenAI-compatible API wrapper
 * Replaces Groq SDK for local LLM inference
 */

// Environment configuration
export const OLLAMA_BASE_URL =
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
export const OLLAMA_MODEL_LIGHT =
    process.env.OLLAMA_MODEL_LIGHT || 'gemma2:2b';
export const OLLAMA_MODEL_STANDARD =
    process.env.OLLAMA_MODEL_STANDARD || 'phi3:3.8b';
export const OLLAMA_MODEL_EXPERT =
    process.env.OLLAMA_MODEL_EXPERT || 'llama3.2';
export const OLLAMA_EMBEDDING_MODEL =
    process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text-v2-moe';

// Types for Ollama API (OpenAI-compatible)
interface OllamaChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface OllamaChatRequest {
    model: string;
    messages: OllamaChatMessage[];
    temperature?: number;
    format?: 'json';
    stream?: boolean;
}

interface OllamaChatChoice {
    index: number;
    message: {
        role: string;
        content: string;
    };
    finish_reason: string;
}

interface OllamaChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: OllamaChatChoice[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

/**
 * Call Ollama chat completions API (OpenAI-compatible endpoint)
 * @param options - Chat completion options
 * @returns Chat completion response
 */
export async function ollamaChat(options: {
    messages: OllamaChatMessage[];
    model?: string;
    temperature?: number;
    response_format?: { type: 'json_object' };
}): Promise<OllamaChatResponse> {
    const {
        messages,
        model = OLLAMA_MODEL_STANDARD,
        temperature = 0.1,
        response_format,
    } = options;

    const requestBody: OllamaChatRequest = {
        model,
        messages,
        temperature,
        stream: false,
    };

    // Add JSON format if requested
    if (response_format?.type === 'json_object') {
        requestBody.format = 'json';
    }

    const response = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `Ollama API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
    }

    const data: OllamaChatResponse = await response.json();
    return data;
}

/**
 * Simple wrapper to get completion content directly
 * @param prompt - User prompt
 * @param options - Optional configuration
 * @returns Completion text content
 */
export async function ollamaComplete(
    prompt: string,
    options?: {
        model?: string;
        temperature?: number;
        systemPrompt?: string;
        jsonMode?: boolean;
    },
): Promise<string> {
    const messages: OllamaChatMessage[] = [];

    if (options?.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await ollamaChat({
        messages,
        model: options?.model,
        temperature: options?.temperature,
        response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
    });

    return response.choices[0]?.message?.content || '';
}

/**
 * Check if Ollama server is available
 * @returns true if server is reachable
 */
export async function checkOllamaHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            method: 'GET',
        });
        return response.ok;
    } catch {
        return false;
    }
}
