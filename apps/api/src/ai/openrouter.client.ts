import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

@Injectable()
export class OpenRouterClient {
  private readonly logger = new Logger(OpenRouterClient.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured() {
    return Boolean(this.config.get<string>('OPENROUTER_API_KEY')?.trim());
  }

  async chat(input: {
    modelId: string;
    messages: ChatMessage[];
    temperature?: number;
  }): Promise<{ content: string; model: string; latencyMs: number }> {
    const apiKey = this.config.get<string>('OPENROUTER_API_KEY')?.trim();
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const started = Date.now();
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://locallife.local',
        'X-Title': 'LocalLife AI',
      },
      body: JSON.stringify({
        model: input.modelId,
        temperature: input.temperature ?? 0.2,
        messages: input.messages,
      }),
    });

    const latencyMs = Date.now() - started;
    if (!res.ok) {
      const text = await res.text();
      this.logger.warn(`OpenRouter error ${res.status}: ${text.slice(0, 300)}`);
      throw new Error(`OpenRouter request failed (${res.status})`);
    }

    const json = (await res.json()) as {
      model?: string;
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content?.trim() ?? '';
    return {
      content,
      model: json.model ?? input.modelId,
      latencyMs,
    };
  }
}
