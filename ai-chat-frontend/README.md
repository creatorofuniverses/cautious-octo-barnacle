# DocuChat AI - Document Chat Interface

A beautiful, modern chat interface for an AI document assistant. This is the **frontend-only** part of the project - ready to be connected to your AI backend.

## Features

- 🎨 **Modern Design** - Clean, professional UI with smooth animations
- 📁 **Document Upload** - Upload PDF, DOC, DOCX, TXT, and MD files
- 💬 **Chat Interface** - Real-time messaging with typing indicators
- 📱 **Responsive** - Works on desktop and mobile devices
- ⚡ **Fast & Lightweight** - Built with Vite and React

## Project Structure

```
ai-chat-frontend/
├── src/
│   ├── App.jsx          # Main chat component
│   ├── App.css          # Component styles
│   ├── index.css        # Global styles
│   └── main.jsx         # Entry point
├── public/
│   └── favicon.svg      # App icon
├── index.html           # HTML template
└── package.json         # Dependencies
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Navigate to the project directory
cd ai-chat-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Production files will be in the `dist/` folder.

## Customization

### Colors

Edit the CSS variables in `src/App.css`:

```css
:root {
  --primary-color: #6366f1;      /* Main brand color */
  --primary-hover: #4f46e5;       /* Hover state */
  --text-primary: #1e293b;        /* Primary text */
  --bg-primary: #ffffff;          /* Background */
  /* ... more variables */
}
```

### Adding AI Backend Integration

The current implementation has placeholder responses. To integrate with your AI backend:

1. Find the `handleSendMessage` function in `App.jsx`
2. Replace the simulated response with your API call:

```javascript
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
    const response = await fetch('YOUR_API_ENDPOINT', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: inputValue,
        documents: uploadedFiles
      })
    })
    
    const data = await response.json()
    
    const botResponse = {
      id: Date.now() + 1,
      type: 'bot',
      content: data.response,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, botResponse])
  } catch (error) {
    console.error('Error:', error)
  } finally {
    setIsTyping(false)
  }
}
```

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Lucide React** - Beautiful icons
- **CSS3** - Custom styling with CSS variables

## License

MIT License - feel free to use this for your projects!
