# AI Chat with Document Upload - Full Stack Application

A modern, full-stack AI chat application that allows you to upload documents (TXT, MD) and ask questions about their content using RAG (Retrieval-Augmented Generation).

## 🚀 Features

- **Modern Chat Interface** - Beautiful, responsive UI with smooth animations
- **Document Upload** - Upload TXT and Markdown files for AI processing
- **RAG-Powered Q&A** - Ask questions about your uploaded documents
- **Dual AI Support** - Choose between OpenAI or local Ollama models
- **Source Attribution** - See which documents were used for answers
- **Docker Support** - Easy deployment with docker-compose

## 📁 Project Structure

```
/workspace
├── ai-chat-frontend/    # React + Vite frontend
├── backend/             # Node.js/Express backend
├── docker-compose.yml   # Docker orchestration
└── README.md           # This file
```

## 🛠️ Tech Stack

### Frontend
- React 18 with Vite
- Lucide Icons
- Modern CSS with CSS Variables

### Backend
- Node.js + Express
- TypeScript
- ChromaDB (Vector Database)
- OpenAI API / Ollama support
- Multer (File uploads)

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

For Ollama (optional):
```bash
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

## 🏃 Quick Start with Docker

1. **Set up environment:**
```bash
cd /workspace
echo "OPENAI_API_KEY=your_key_here" > .env
```

2. **Start all services:**
```bash
docker-compose up --build
```

3. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- ChromaDB: http://localhost:8000

## 🖥️ Manual Setup (Development)

### Backend

```bash
cd /workspace/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your API keys

# Run in development mode
npm run dev
```

Backend will be available at `http://localhost:5000`

### Frontend

```bash
cd /workspace/ai-chat-frontend

# Install dependencies (if not already done)
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env.local

# Run in development mode
npm run dev
```

Frontend will be available at `http://localhost:5173`

## 📡 API Endpoints

### POST `/api/upload`
Upload a document (TXT or MD)
- **Request**: `multipart/form-data` with `file` field
- **Response**: `{ message, filename, chunks }`

### GET `/api/documents`
List all uploaded documents
- **Response**: `{ documents: string[] }`

### DELETE `/api/documents/:filename`
Delete a document
- **Response**: `{ message }`

### POST `/api/chat`
Send a chat message
- **Request**: `{ message: string, aiProvider?: 'openai' | 'ollama' }`
- **Response**: `{ response: string, sources: [] }`

### GET `/api/health`
Health check endpoint
- **Response**: `{ status, services }`

## 🤖 AI Providers

### OpenAI (Default)
- Requires `OPENAI_API_KEY` environment variable
- Uses GPT-3.5-turbo for responses
- Uses text-embedding-ada-002 for embeddings

### Ollama (Local)
- Free, runs locally on your machine
- Install from https://ollama.ai
- Pull a model: `ollama pull llama2`
- Set `OLLAMA_BASE_URL` in environment

Switch between providers using the settings gear icon in the sidebar.

## 📝 How It Works

1. **Upload Documents**: Upload TXT or MD files through the sidebar
2. **Processing**: Documents are chunked and embedded using OpenAI embeddings
3. **Storage**: Embeddings stored in ChromaDB vector database
4. **Query**: When you ask a question:
   - System searches for relevant document chunks
   - Top matches are sent as context to the AI
   - AI generates answer based on context
5. **Response**: Answer displayed with source attribution

## 🔧 Customization

### Supported File Types
Currently supports `.txt` and `.md` files. To add more:
1. Update backend `src/routes/api.ts` file filter
2. Update frontend `App.jsx` accept attribute
3. Implement parsing logic for new formats

### Chunking Strategy
Documents are split by paragraphs (`\n\n`). Customize in `backend/src/services/document.ts`.

### AI Model
Change the model in:
- OpenAI: `backend/src/services/openai.ts`
- Ollama: `backend/src/services/ollama.ts`

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up --build -d

# Access backend container
docker-compose exec backend sh
```

## 📊 Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend    │────▶│  ChromaDB   │
│  (React)    │◀────│ (Express/TS) │◀────│ (Vector DB) │
└─────────────┘     └──────────────┘     └─────────────┘
                          │
                    ┌─────┴─────┐
                    ▼           ▼
              ┌──────────┐ ┌──────────┐
              │ OpenAI   │ │  Ollama  │
              │   API    │ │ (Local)  │
              └──────────┘ └──────────┘
```

## 🔒 Security Notes

- No authentication implemented (add later as needed)
- File upload limited to 10MB
- Only TXT and MD files allowed
- CORS enabled for localhost development

## 🚧 Future Enhancements

- [ ] PDF and DOCX support
- [ ] User authentication
- [ ] Multiple chat sessions
- [ ] Streaming responses
- [ ] Advanced chunking strategies
- [ ] Hybrid search (keyword + semantic)
- [ ] Conversation history persistence
- [ ] Admin dashboard

## 📄 License

MIT License - feel free to use for personal or commercial projects!

## 🤝 Contributing

Issues and PRs welcome! This is a starter project meant to be customized.

---

**Need help?** Check the architecture plan in `/workspace/ARCHITECTURE_PLAN.md` for detailed implementation details.