import { Injectable, OnModuleInit } from '@nestjs/common';
import { OllamaEmbeddings } from '../agents/models/ollama-embeddings';
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/classic/text_splitter';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private store: MemoryVectorStore | null = null;
  private readonly embeddings: OllamaEmbeddings;
  private readonly vectorStorePath: string;
  private readonly knowledgeBasePath: string;

  constructor() {
    // Use local Ollama embeddings (no API key needed)
    this.embeddings = new OllamaEmbeddings();
    console.log('🔗 Using local Ollama embeddings (nomic-embed-text-v2-moe)');

    this.vectorStorePath = path.join(
      process.cwd(),
      'data',
      'vector_store',
      'db.json',
    );
    this.knowledgeBasePath = path.join(
      process.cwd(),
      'data',
      'knowledge_base',
      'protocols',
    );
  }

  async onModuleInit() {
    await this.initialize();
  }

  // Load vector store from disk or create new one
  async initialize() {
    if (this.store) return;

    try {
      // Try loading from file
      const fileData = await fs.readFile(this.vectorStorePath, 'utf-8');
      const json = JSON.parse(fileData);

      // Rehydrate MemoryVectorStore from JSON
      this.store = await MemoryVectorStore.fromTexts(
        json.texts,
        json.metadatas,
        this.embeddings,
      );
      console.log('✅ Vector Store loaded from disk.');
    } catch (error) {
      console.log('⚠️  No existing vector store found. Creating new one...');
      // Empty store
      this.store = new MemoryVectorStore(this.embeddings);

      // Seed data immediately if empty
      await this.seed();
    }
  }

  // Read markdown files, embed, and save to disk
  async seed() {
    console.log('🌱 Seeding database from knowledge base...');

    try {
      // Read all .md files
      const files = await fs.readdir(this.knowledgeBasePath);
      const docs: Document[] = [];

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = path.join(this.knowledgeBasePath, file);
        const content = await fs.readFile(filePath, 'utf-8');

        docs.push(
          new Document({
            pageContent: content,
            metadata: { source: file },
          }),
        );
      }

      if (docs.length === 0) {
        console.warn('⚠️  No documents found in knowledge base.');
        return;
      }

      // Split text
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const splitDocs = await splitter.splitDocuments(docs);

      // Create store
      this.store = await MemoryVectorStore.fromDocuments(
        splitDocs,
        this.embeddings,
      );

      console.log(`Database seeded with ${splitDocs.length} chunks.`);
    } catch (error) {
      console.error('Error seeding vector store:', error);
      // Keep empty store
      this.store = new MemoryVectorStore(this.embeddings);
    }
  }

  getRetriever() {
    if (!this.store) throw new Error('Vector Store not initialized');
    return this.store.asRetriever({ k: 3 }); // Retrieve top 3 relevant chunks
  }

  getEmbeddings() {
    return this.embeddings;
  }
}
