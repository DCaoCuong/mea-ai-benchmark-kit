/**
 * Ollama Embeddings - LangChain-compatible wrapper
 * Replaces GoogleGenerativeAIEmbeddings for local embedding
 */
import { Embeddings, type EmbeddingsParams } from '@langchain/core/embeddings';
import { OLLAMA_BASE_URL, OLLAMA_EMBEDDING_MODEL } from './ollama.models';

interface OllamaEmbeddingResponse {
    embedding: number[];
}

export class OllamaEmbeddings extends Embeddings {
    private readonly model: string;
    private readonly baseUrl: string;

    constructor(
        params?: EmbeddingsParams & {
            model?: string;
            baseUrl?: string;
        },
    ) {
        super(params ?? {});
        this.model = params?.model ?? OLLAMA_EMBEDDING_MODEL;
        this.baseUrl = params?.baseUrl ?? OLLAMA_BASE_URL;
    }

    /**
     * Embed a single query text
     */
    async embedQuery(text: string): Promise<number[]> {
        const response = await fetch(`${this.baseUrl}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt: text,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama embedding error: ${response.statusText}`);
        }

        const data: OllamaEmbeddingResponse = await response.json();
        return data.embedding;
    }

    /**
     * Embed multiple documents
     */
    async embedDocuments(documents: string[]): Promise<number[][]> {
        // Process sequentially to avoid overwhelming Ollama
        const embeddings: number[][] = [];
        for (const doc of documents) {
            const embedding = await this.embedQuery(doc);
            embeddings.push(embedding);
        }
        return embeddings;
    }
}
