import type { AiChatRequest, AiChatResponse, AiProvider } from '@dealos/types';
import { AppError } from '@dealos/utils';

export interface AiProviderClient {
  provider: AiProvider;
  chat(request: AiChatRequest): Promise<AiChatResponse>;
}

interface HttpProviderConfig {
  provider: AiProvider;
  apiKey: string;
  endpoint: string;
  mapRequest: (request: AiChatRequest) => Record<string, unknown>;
  mapResponse: (response: unknown, model: string) => AiChatResponse;
}

const requestAiProvider = async (config: HttpProviderConfig, request: AiChatRequest) => {
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(config.mapRequest(request))
  });

  if (!response.ok) {
    const text = await response.text();
    throw new AppError(`AI provider request failed: ${text}`, {
      statusCode: response.status,
      code: 'AI_PROVIDER_REQUEST_FAILED'
    });
  }

  const payload = await response.json();
  return config.mapResponse(payload, request.model);
};

const extractContent = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'object' && item && 'text' in item ? String(item.text) : ''))
      .join('\n')
      .trim();
  }

  return '';
};

const asObject = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

export const createOpenAiClient = (apiKey: string): AiProviderClient => ({
  provider: 'openai',
  chat: async (request) =>
    requestAiProvider(
      {
        provider: 'openai',
        apiKey,
        endpoint: 'https://api.openai.com/v1/chat/completions',
        mapRequest: (input) => ({
          model: input.model,
          messages: input.messages,
          temperature: input.temperature,
          max_tokens: input.maxTokens
        }),
        mapResponse: (payload, model) => {
          const data = asObject(payload);
          const usage = asObject(data.usage);
          const choices = Array.isArray(data.choices) ? data.choices : [];
          const firstChoice = asObject(choices[0]);
          const message = asObject(firstChoice.message);

          return {
          provider: 'openai',
          model,
          content: extractContent(message.content),
          usage: {
            inputTokens: typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : undefined,
            outputTokens:
              typeof usage.completion_tokens === 'number' ? usage.completion_tokens : undefined
          }
          };
        }
      },
      request,
    )
});

export const createOpenRouterClient = (apiKey: string): AiProviderClient => ({
  provider: 'openrouter',
  chat: async (request) =>
    requestAiProvider(
      {
        provider: 'openrouter',
        apiKey,
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        mapRequest: (input) => ({
          model: input.model,
          messages: input.messages,
          temperature: input.temperature,
          max_tokens: input.maxTokens
        }),
        mapResponse: (payload, model) => {
          const data = asObject(payload);
          const usage = asObject(data.usage);
          const choices = Array.isArray(data.choices) ? data.choices : [];
          const firstChoice = asObject(choices[0]);
          const message = asObject(firstChoice.message);

          return {
          provider: 'openrouter',
          model,
          content: extractContent(message.content),
          usage: {
            inputTokens: typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : undefined,
            outputTokens:
              typeof usage.completion_tokens === 'number' ? usage.completion_tokens : undefined
          }
          };
        }
      },
      request,
    )
});

export const createAnthropicClient = (apiKey: string): AiProviderClient => ({
  provider: 'anthropic',
  chat: async (request) =>
    requestAiProvider(
      {
        provider: 'anthropic',
        apiKey,
        endpoint: 'https://api.anthropic.com/v1/messages',
        mapRequest: (input) => ({
          model: input.model,
          messages: input.messages
            .filter((item) => item.role !== 'system')
            .map((item) => ({ role: item.role, content: item.content })),
          system: input.messages.find((item) => item.role === 'system')?.content,
          temperature: input.temperature,
          max_tokens: input.maxTokens ?? 512
        }),
        mapResponse: (payload, model) => {
          const data = asObject(payload);
          const usage = asObject(data.usage);
          return {
          provider: 'anthropic',
          model,
          content: extractContent(data.content),
          usage: {
            inputTokens: typeof usage.input_tokens === 'number' ? usage.input_tokens : undefined,
            outputTokens: typeof usage.output_tokens === 'number' ? usage.output_tokens : undefined
          }
          };
        }
      },
      request,
    )
});

export const createGeminiClient = (apiKey: string): AiProviderClient => ({
  provider: 'gemini',
  chat: async (request) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: request.messages
          .filter((item) => item.role !== 'system')
          .map((item) => ({
            role: item.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: item.content }]
          })),
        systemInstruction: request.messages.find((item) => item.role === 'system')
          ? {
              parts: [{ text: request.messages.find((item) => item.role === 'system')?.content ?? '' }]
            }
          : undefined,
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.maxTokens
        }
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new AppError(`AI provider request failed: ${text}`, {
        statusCode: response.status,
        code: 'AI_PROVIDER_REQUEST_FAILED'
      });
    }

    const payload = asObject(await response.json());
    const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
    const firstCandidate = asObject(candidates[0]);
    const content = asObject(firstCandidate.content);
    const parts = Array.isArray(content.parts) ? content.parts : [];
    const usage = asObject(payload.usageMetadata);

    return {
      provider: 'gemini',
      model: request.model,
      content: extractContent(
        parts.map((part) => asObject(part).text).filter((part) => typeof part === 'string').join('\n'),
      ),
      usage: {
        inputTokens: typeof usage.promptTokenCount === 'number' ? usage.promptTokenCount : undefined,
        outputTokens:
          typeof usage.candidatesTokenCount === 'number' ? usage.candidatesTokenCount : undefined
      }
    };
  }
});
