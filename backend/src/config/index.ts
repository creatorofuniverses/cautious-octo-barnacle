export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  chromaDbPath: process.env.CHROMA_DB_PATH || '/app/data/chroma',
  uploadDir: process.env.UPLOAD_DIR || '/app/uploads',
};
