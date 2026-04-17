import { useState, useRef, useEffect } from 'react'
import { Send, Upload, FileText, X, Bot, User, Trash2, Plus, Settings, Loader } from 'lucide-react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your AI assistant. Upload some documents and I'll help you answer questions about their content.",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [aiProvider, setAiProvider] = useState('openai')
  const [showSettings, setShowSettings] = useState(false)
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newUserMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          aiProvider,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.response,
        timestamp: new Date(),
        sources: data.sources,
      }
      setMessages(prev => [...prev, botResponse])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "Sorry, I encountered an error. Please make sure the backend is running and try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    
    for (const file of files) {
      if (!['.txt', '.md'].includes('.' + file.name.split('.').pop().toLowerCase())) {
        alert('Only .txt and .md files are supported')
        continue
      }

      setUploading(true)
      
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error('Upload failed')
        }
        
        const result = await response.json()
        
        const newFile = {
          id: Date.now() + Math.random(),
          name: result.filename,
          size: formatFileSize(file.size),
          type: getFileType(file.name),
          chunks: result.chunks,
        }
        setUploadedFiles(prev => [...prev, newFile])
      } catch (error) {
        console.error('Upload error:', error)
        alert(`Failed to upload ${file.name}`)
      } finally {
        setUploading(false)
      }
    }
  }

  const removeFile = async (fileId) => {
    const file = uploadedFiles.find(f => f.id === fileId)
    if (!file) return
    
    try {
      await fetch(`${API_URL}/documents/${encodeURIComponent(file.name)}`, {
        method: 'DELETE',
      })
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete document')
    }
  }

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      type: 'bot',
      content: "Chat cleared! Upload some documents and I'll help you answer questions about their content.",
      timestamp: new Date()
    }])
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase()
    if (['pdf'].includes(ext)) return 'pdf'
    if (['doc', 'docx'].includes(ext)) return 'word'
    if (['txt', 'md'].includes(ext)) return 'text'
    return 'file'
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <Bot size={28} />
            <h1>DocuChat AI</h1>
          </div>
          <button className="new-chat-btn" onClick={clearChat}>
            <Plus size={20} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="documents-section">
          <h3>Your Documents</h3>
          <div 
            className={`upload-area ${uploading ? 'uploading' : ''}`} 
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader size={24} className="spinning" />
            ) : (
              <Upload size={24} />
            )}
            <p>{uploading ? 'Uploading...' : 'Click to upload'}</p>
            <span>TXT, MD</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          {uploadedFiles.length > 0 && (
            <div className="file-list">
              {uploadedFiles.map(file => (
                <div key={file.id} className="file-item">
                  <div className="file-info">
                    <FileText size={18} className="file-icon" />
                    <div className="file-details">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{file.size} • {file.chunks} chunks</span>
                    </div>
                  </div>
                  <button className="remove-file" onClick={() => removeFile(file.id)}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="chat-info">
            <span>{messages.length - 1} messages</span>
            <span>{uploadedFiles.length} documents</span>
          </div>
          <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={18} />
          </button>
        </div>

        {showSettings && (
          <div className="settings-panel">
            <h4>AI Provider</h4>
            <div className="provider-options">
              <label className="provider-option">
                <input
                  type="radio"
                  name="provider"
                  value="openai"
                  checked={aiProvider === 'openai'}
                  onChange={(e) => setAiProvider(e.target.value)}
                />
                <span>OpenAI</span>
              </label>
              <label className="provider-option">
                <input
                  type="radio"
                  name="provider"
                  value="ollama"
                  checked={aiProvider === 'ollama'}
                  onChange={(e) => setAiProvider(e.target.value)}
                />
                <span>Ollama (Local)</span>
              </label>
            </div>
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        <header className="chat-header">
          <h2>AI Assistant</h2>
          <button className="clear-chat" onClick={clearChat}>
            <Trash2 size={18} />
            <span>Clear Chat</span>
          </button>
        </header>

        <div className="messages-container">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-avatar">
                {message.type === 'bot' ? (
                  <div className="avatar bot-avatar">
                    <Bot size={20} />
                  </div>
                ) : (
                  <div className="avatar user-avatar">
                    <User size={20} />
                  </div>
                )}
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  <p>{message.content}</p>
                  {message.sources && message.sources.length > 0 && (
                    <div className="sources-section">
                      <h5>Sources:</h5>
                      <div className="sources-list">
                        {message.sources.map((source, idx) => (
                          <div key={idx} className="source-item">
                            <FileText size={14} />
                            <span>{source.metadata?.filename || 'Document'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message bot typing">
              <div className="message-avatar">
                <div className="avatar bot-avatar">
                  <Bot size={20} />
                </div>
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-wrapper">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your documents..."
              rows={1}
            />
            <button 
              className="send-button" 
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
            >
              <Send size={20} />
            </button>
          </div>
          <p className="disclaimer">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </main>
    </div>
  )
}

export default App
