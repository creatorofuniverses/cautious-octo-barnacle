import { getOrCreateCollection } from '../config/chroma';
import OpenAI from 'openai';
import { config } from '../config';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

export class DocumentService {
  async processDocument(fileBuffer: Buffer, filename: string): Promise<{ id: string; chunks: number }> {
    const collection = await getOrCreateCollection('documents');
    
    // Simple chunking by paragraphs for TXT/MD files
    const text = fileBuffer.toString('utf-8');
    const chunks = text.split(/\n\n+/).filter(chunk => chunk.trim().length > 0);
    
    const ids: string[] = [];
    const documents: string[] = [];
    const metadatas: Array<{ filename: string; chunkIndex: number }> = [];
    
    chunks.forEach((chunk, index) => {
      const id = `${filename}-${index}`;
      ids.push(id);
      documents.push(chunk);
      metadatas.push({
        filename,
        chunkIndex: index,
      });
    });
    
    if (ids.length > 0) {
      // Generate embeddings using OpenAI
      const embeddings = await this.generateEmbeddings(documents);
      
      await collection.add({
        ids,
        embeddings,
        documents,
        metadatas,
      });
    }
    
    return {
      id: filename,
      chunks: chunks.length,
    };
  }

  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: texts,
    });
    
    return response.data.map(item => item.embedding);
  }

  async searchDocuments(query: string, limit: number = 5): Promise<{ text: string; metadata: any }[]> {
    const collection = await getOrCreateCollection('documents');
    
    // Generate embedding for query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      include: ['documents', 'metadatas'],
    });
    
    if (!results.documents || !results.metadatas) {
      return [];
    }
    
    return results.documents[0].map((doc, index) => ({
      text: doc || '',
      metadata: results.metadatas?.[0]?.[index] || {},
    }));
  }

  async deleteDocument(filename: string): Promise<void> {
    const collection = await getOrCreateCollection('documents');
    
    // Delete all chunks with this filename
    const results = await collection.get({
      where: { filename },
    });
    
    if (results.ids.length > 0) {
      await collection.delete({
        ids: results.ids,
      });
    }
  }

  async listDocuments(): Promise<string[]> {
    const collection = await getOrCreateCollection('documents');
    
    const results = await collection.get({
      include: ['metadatas'],
    });
    
    const filenames = new Set<string>();
    results.metadatas.forEach(metadata => {
      if (metadata && 'filename' in metadata) {
        filenames.add(metadata.filename as string);
      }
    });
    
    return Array.from(filenames);
  }
}
