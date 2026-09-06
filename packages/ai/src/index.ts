import { aiEnvSchema } from '@dealos/config';
import type { AiChatRequest, AiChatResponse, AiProvider } from '@dealos/types';
import { AppError, validateRuntimeEnv } from '@dealos/utils';
import {
  createAnthropicClient,
  createGeminiClient,
  createOpenAiClient,
  createOpenRouterClient,
  type AiProviderClient
} from './providers.js';

export interface AiClient {
  provider: AiProvider;
  chat(request: Omit<AiChatRequest, 'provider'>): Promise<AiChatResponse>;
}

const providerFactoryMap: Record<AiProvider, (apiKey: string) => AiProviderClient> = {
  openai: createOpenAiClient,
  openrouter: createOpenRouterClient,
  anthropic: createAnthropicClient,
  gemini: createGeminiClient
};

const getApiKey = (provider: AiProvider, env: Record<string, unknown>): string => {
  switch (provider) {
    case 'openai':
      return String(env.OPENAI_API_KEY ?? '');
    case 'openrouter':
      return String(env.OPENROUTER_API_KEY ?? '');
    case 'anthropic':
      return String(env.ANTHROPIC_API_KEY ?? '');
    case 'gemini':
      return String(env.GEMINI_API_KEY ?? '');
  }
};

export const createAiClient = (
  provider: AiProvider,
  env: Record<string, unknown> = process.env,
): AiClient => {
  validateRuntimeEnv(aiEnvSchema, env);
  const apiKey = getApiKey(provider, env);

  if (!apiKey) {
    throw new AppError(`Missing API key for provider: ${provider}`, {
      statusCode: 500,
      code: 'AI_PROVIDER_KEY_MISSING'
    });
  }

  const providerClient = providerFactoryMap[provider](apiKey);
  return {
    provider,
    chat: async (request) => providerClient.chat({ ...request, provider })
  };
};
