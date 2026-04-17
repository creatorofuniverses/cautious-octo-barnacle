import OpenAI from 'openai';
import { config } from '../config';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openaiApiKey,
    });
  }

  async generateResponse(prompt: string, context?: string): Promise<string> {
    const systemMessage = context
      ? `You are a helpful AI assistant. Use the following context to answer questions. If the answer is not in the context, say so.\n\nContext:\n${context}`
      : 'You are a helpful AI assistant.';

    const response = await this.client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  }
}
