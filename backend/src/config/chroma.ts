import { ChromaClient, IncludeEnum } from 'chromadb';

let chromaClient: ChromaClient | null = null;

export const getChromaClient = async (): Promise<ChromaClient> => {
  if (!chromaClient) {
    chromaClient = new ChromaClient({
      path: process.env.CHROMA_DB_PATH || '/app/data/chroma',
    });
  }
  return chromaClient;
};

export const getOrCreateCollection = async (collectionName: string) => {
  const client = await getChromaClient();
  
  try {
    const collection = await client.getCollection({ 
      name: collectionName,
      embeddingFunction: undefined as any,
    });
    return collection;
  } catch (error) {
    const collection = await client.createCollection({ 
      name: collectionName,
      metadata: undefined,
      embeddingFunction: undefined as any,
    });
    return collection;
  }
};
