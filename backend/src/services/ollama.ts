import axios from 'axios';
import { config } from '../config';

export class OllamaService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.ollamaBaseUrl;
  }

  async generateResponse(prompt: string, context?: string): Promise<string> {
    const systemMessage = context
      ? `You are a helpful AI assistant. Use the following context to answer questions. If the answer is not in the context, say so.\n\nContext:\n${context}`
      : 'You are a helpful AI assistant.';

    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: 'llama2',
        prompt: `${systemMessage}\n\nUser: ${prompt}\nAssistant:`,
        stream: false,
      });

      return response.data.response || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('Ollama error:', error);
      throw new Error('Failed to generate response from Ollama');
    }
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/tags`);
      return true;
    } catch {
      return false;
    }
  }
}
