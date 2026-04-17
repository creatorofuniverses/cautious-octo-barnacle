# AI Document Chat - Architecture Plan

## 🎯 Overview

A full-stack application that allows users to upload documents, process them with AI, and ask questions about the content using Retrieval-Augmented Generation (RAG).

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                    (React + Vite + Tailwind)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │   Upload    │  │     Chat     │  │  Document Manager   │   │
│  │   Panel     │  │   Interface  │  │     (Sidebar)       │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
│                    (Node.js + Express / FastAPI)                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │    REST     │  │   WebSocket  │  │   Authentication    │   │
│  │    API      │  │   Handler    │  │      Middleware     │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐            │
│         ▼                    ▼                    ▼            │
│  ┌─────────────┐     ┌──────────────┐    ┌─────────────────┐  │
│  │  Document   │     │    Query     │    │   Conversation  │  │
│  │  Processor  │     │   Engine     │    │     Manager     │  │
│  └─────────────┘     └──────────────┘    └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐
     │  Vector DB  │ │ Relational  │ │   File Storage  │
     │ (ChromaDB/  │ │     DB      │ │   (Local/S3)    │
     │  Pinecone)  │ │ (PostgreSQL)│ │                 │
     └─────────────┘ └─────────────┘ └─────────────────┘
                              │
                              ▼
     ┌─────────────────────────────────────────┐
     │           AI/LLM Services               │
     │  ┌─────────────┐  ┌─────────────────┐  │
     │  │   OpenAI    │  │  Local LLM      │  │
     │  │   (GPT-4)   │  │  (Ollama/Llama) │  │
     │  └─────────────┘  └─────────────────┘  │
     └─────────────────────────────────────────┘
```

---

## 📦 Tech Stack Options

### Option A: JavaScript/TypeScript Full-Stack (Recommended for Simplicity)
| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TailwindCSS |
| Backend | Node.js + Express/Fastify |
| Language | TypeScript |
| Vector DB | ChromaDB (embedded) or Pinecone (cloud) |
| Relational DB | PostgreSQL or SQLite |
| File Storage | Local FS or AWS S3 |
| AI Provider | OpenAI API or Ollama (local) |
| Queue System | Bull (Redis) for async processing |

### Option B: Python Backend (Best for AI/ML)
| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TailwindCSS |
| Backend | FastAPI |
| Vector DB | ChromaDB / Qdrant / Weaviate |
| Relational DB | PostgreSQL |
| File Storage | Local FS or AWS S3 |
| AI Provider | LangChain + OpenAI/LlamaIndex |
| Queue System | Celery + Redis |

### Option C: Modern Serverless
| Layer | Technology |
|-------|------------|
| Frontend | Next.js (Full-stack) |
| Backend | Next.js API Routes / Cloud Functions |
| Vector DB | Pinecone / Supabase pgvector |
| Relational DB | PostgreSQL (Supabase/Neon) |
| File Storage | Vercel Blob / AWS S3 |
| AI Provider | Vercel AI SDK + OpenAI |

---

## 🔧 Core Components

### 1. **Document Processing Pipeline**
```
Upload → Validate → Extract Text → Chunk → Embed → Store
```

**Steps:**
1. **File Upload**: Accept PDF, DOCX, TXT, MD files
2. **Text Extraction**: 
   - PDF: `pdf-parse` (Node) or `PyPDF2` (Python)
   - DOCX: `mammoth` (Node) or `python-docx` (Python)
3. **Text Chunking**: Split into overlapping chunks (500-1000 tokens)
4. **Embedding**: Generate vector embeddings via AI
5. **Storage**: Save vectors + metadata to Vector DB

### 2. **Query Engine (RAG)**
```
User Question → Embed → Similarity Search → Context Assembly → LLM → Answer
```

**Steps:**
1. **Embed Question**: Convert user query to vector
2. **Similarity Search**: Find top-K relevant chunks from Vector DB
3. **Context Assembly**: Build prompt with retrieved context
4. **LLM Call**: Send to AI with context + question
5. **Stream Response**: Return answer incrementally (optional)

### 3. **Conversation Management**
- Store conversation history in Relational DB
- Track which documents are associated with each conversation
- Enable conversation branching/forking
- Support multiple chat sessions per user

### 4. **Authentication & Authorization** (Optional for MVP)
- JWT-based authentication
- User-specific document isolation
- Role-based access control (future)

---

## 🗄️ Database Schema

### PostgreSQL Tables

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role VARCHAR(50), -- 'user' or 'assistant'
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  filename VARCHAR(255),
  file_path VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(100),
  status VARCHAR(50), -- 'pending', 'processing', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversation-Documents relationship
CREATE TABLE conversation_documents (
  conversation_id UUID REFERENCES conversations(id),
  document_id UUID REFERENCES documents(id),
  PRIMARY KEY (conversation_id, document_id)
);
```

### Vector DB Collections

```
Collection: document_chunks
- id: string
- document_id: string
- chunk_index: int
- text: string
- embedding: vector[1536]
- metadata: {filename, page_number, etc.}
```

---

## 🚀 API Endpoints

### Authentication (Optional)
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Conversations
```
GET    /api/conversations              - List all conversations
POST   /api/conversations              - Create new conversation
GET    /api/conversations/:id          - Get conversation details
DELETE /api/conversations/:id          - Delete conversation
PUT    /api/conversations/:id/title    - Update conversation title
```

### Messages
```
POST   /api/conversations/:id/messages         - Send message (streaming)
GET    /api/conversations/:id/messages         - Get message history
DELETE /api/messages/:id                       - Delete message
```

### Documents
```
POST   /api/documents                  - Upload document(s)
GET    /api/documents                  - List all documents
GET    /api/documents/:id              - Get document details
DELETE /api/documents/:id              - Delete document
GET    /api/documents/:id/chunks       - View document chunks (debug)
```

### Health & Info
```
GET    /api/health                     - Health check
GET    /api/models                     - List available AI models
```

---

## 🔄 Data Flow Examples

### 1. Document Upload Flow
```
1. User selects file in frontend
2. Frontend uploads to POST /api/documents (multipart/form-data)
3. Backend saves file to storage
4. Backend creates DB record (status: 'pending')
5. Background job processes document:
   - Extract text
   - Chunk text
   - Generate embeddings
   - Store in Vector DB
6. Update DB record (status: 'completed')
7. Notify frontend via WebSocket/polling
```

### 2. Chat Query Flow
```
1. User sends message in chat
2. Frontend sends POST /api/conversations/:id/messages
3. Backend saves user message to DB
4. Query Engine:
   - Embed user question
   - Search Vector DB for similar chunks
   - Build context-aware prompt
   - Call LLM API
5. Stream response back to frontend (Server-Sent Events or WebSocket)
6. Save assistant response to DB
```

---

## 📁 Project Structure (Option A - TypeScript Full-Stack)

```
ai-doc-chat/
├── frontend/                    # React app (already created)
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── index.ts            # Entry point
│   │   ├── server.ts           # Express setup
│   │   ├── routes/
│   │   │   ├── conversations.ts
│   │   │   ├── documents.ts
│   │   │   └── auth.ts
│   │   ├── controllers/
│   │   │   ├── conversationController.ts
│   │   │   ├── documentController.ts
│   │   │   └── chatController.ts
│   │   ├── services/
│   │   │   ├── documentProcessor.ts
│   │   │   ├── vectorStore.ts
│   │   │   ├── llmService.ts
│   │   │   └── embeddingService.ts
│   │   ├── models/
│   │   │   ├── database.ts
│   │   │   └── schemas.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── upload.ts
│   │   ├── utils/
│   │   │   ├── textChunking.ts
│   │   │   └── logger.ts
│   │   └── types/
│   │       └── index.ts
│   ├── uploads/                # Temporary file storage
│   ├── tests/
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── docker-compose.yml          # For DBs and services
└── README.md
```

---

## 🛠️ Implementation Phases

### Phase 1: MVP (Core Functionality)
- [ ] Backend setup (Express + TypeScript)
- [ ] Document upload & storage
- [ ] Basic text extraction (TXT, MD first)
- [ ] Simple embedding + ChromaDB integration
- [ ] Basic RAG query flow
- [ ] Chat endpoint with OpenAI
- [ ] Connect frontend to backend

### Phase 2: Enhanced Features
- [ ] PDF & DOCX support
- [ ] Better text chunking strategies
- [ ] Streaming responses (SSE)
- [ ] Conversation history persistence
- [ ] Document management UI
- [ ] Error handling & retries

### Phase 3: Production Ready
- [ ] Authentication system
- [ ] PostgreSQL integration
- [ ] Background job queue (Bull + Redis)
- [ ] Rate limiting
- [ ] Logging & monitoring
- [ ] Docker deployment
- [ ] CI/CD pipeline

### Phase 4: Advanced Features (Future)
- [ ] Multiple AI model support
- [ ] Local LLM option (Ollama)
- [ ] Multi-user collaboration
- [ ] Document annotations
- [ ] Export conversations
- [ ] Analytics dashboard

---

## 🔐 Security Considerations

1. **File Upload Security**
   - Validate file types (magic bytes, not just extension)
   - File size limits
   - Virus scanning (ClamAV)
   - Sanitize filenames

2. **API Security**
   - Rate limiting
   - Input validation & sanitization
   - CORS configuration
   - API key protection

3. **Data Security**
   - Encrypt sensitive data at rest
   - Secure environment variables
   - Isolate user data

---

## 💰 Cost Estimates (Monthly)

| Service | Free Tier | Paid (Estimate) |
|---------|-----------|-----------------|
| OpenAI API | ~$5 credit | $10-50 (usage-based) |
| Pinecone | 1 project free | $25+/month |
| Vercel/Netlify | Generous free tier | $20+/month |
| PostgreSQL (Neon/Supabase) | Free tier available | $10+/month |
| **Total** | **~$0-5** | **$50-100/month** |

*Note: Using local LLM (Ollama) + ChromaDB can reduce costs significantly*

---

## 🎯 Recommended Approach for You

Based on your existing React frontend, I recommend **Option A (TypeScript Full-Stack)** because:

1. ✅ Single language (TypeScript) for entire stack
2. ✅ Easy to maintain and extend
3. ✅ Great ecosystem for document processing
4. ✅ Your frontend can be directly integrated
5. ✅ Lower learning curve

**Quick Start Stack:**
- Backend: Express + TypeScript
- Vector DB: ChromaDB (embedded, no external service needed)
- Relational DB: SQLite (for MVP) → PostgreSQL later
- File Storage: Local filesystem
- AI: OpenAI API (easy to swap later)

---

## ❓ Questions for Your Review

Before implementation, please consider:

1. **Backend Preference**: TypeScript (Node.js) or Python (FastAPI)?
2. **Authentication**: Needed for MVP or add later?
3. **AI Provider**: OpenAI API or local LLM (Ollama)?
4. **Deployment**: Local only, or cloud deployment planned?
5. **Document Types**: Which formats are priority? (PDF, DOCX, TXT, MD?)
6. **Streaming**: Real-time streaming responses needed?

---

Let me know your thoughts on this architecture, and we can proceed with implementation! 🚀
