import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { DocumentService } from '../services/document';
import { OpenAIService } from '../services/openai';
import { OllamaService } from '../services/ollama';
import { config } from '../config';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt and .md files are allowed'));
    }
  },
});

const documentService = new DocumentService();
const openaiService = new OpenAIService();
const ollamaService = new OllamaService();

// Upload document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fs = await import('fs');
    const fileBuffer = fs.readFileSync(req.file.path);
    
    const result = await documentService.processDocument(fileBuffer, req.file.filename);
    
    res.json({
      message: 'Document uploaded successfully',
      filename: req.file.filename,
      chunks: result.chunks,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

// List documents
router.get('/documents', async (_req, res) => {
  try {
    const documents = await documentService.listDocuments();
    res.json({ documents });
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

// Delete document
router.delete('/documents/:filename', async (req, res) => {
  try {
    await documentService.deleteDocument(req.params.filename);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, aiProvider = 'openai' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Search for relevant documents
    const searchResults = await documentService.searchDocuments(message, 5);
    
    // Combine context from search results
    const context = searchResults.map(result => result.text).join('\n\n');

    let response: string;
    
    if (aiProvider === 'ollama') {
      response = await ollamaService.generateResponse(message, context);
    } else {
      response = await openaiService.generateResponse(message, context);
    }

    res.json({
      response,
      sources: searchResults.map(s => ({
        text: s.text.substring(0, 200) + '...',
        metadata: s.metadata,
      })),
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Health check
router.get('/health', async (_req, res) => {
  const ollamaAvailable = await ollamaService.checkAvailability();
  res.json({
    status: 'ok',
    services: {
      ollama: ollamaAvailable ? 'available' : 'unavailable',
    },
  });
});

export default router;
