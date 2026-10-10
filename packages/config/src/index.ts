import { z } from 'zod';

const nodeEnvSchema = z.enum(['development', 'test', 'production']).default('development');

export const commonEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema
});

export const databaseEnvSchema = commonEnvSchema.extend({
  DATABASE_URL: z.string().url()
});

export const adminEnvSchema = commonEnvSchema.extend({
  ADMIN_JWT_SECRET: z.string().min(32),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(12)
});

export const apiEnvSchema = commonEnvSchema.extend({
  API_PORT: z.coerce.number().int().positive().default(3002),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  ADMIN_JWT_SECRET: z.string().min(32),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001')
});

export const aiEnvSchema = commonEnvSchema.extend({
  AI_PROVIDER: z.enum(['openai', 'openrouter', 'anthropic', 'gemini']).optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional()
});

export const authEnvSchema = commonEnvSchema.extend({
  AUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional()
});

export type CommonEnv = z.infer<typeof commonEnvSchema>;
export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
export type AdminEnv = z.infer<typeof adminEnvSchema>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type AiEnv = z.infer<typeof aiEnvSchema>;
export type AuthEnv = z.infer<typeof authEnvSchema>;

export const validateEnv = <T extends z.ZodTypeAny>(schema: T, env: unknown): z.infer<T> => {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Environment validation failed: ${message}`);
  }

  return parsed.data;
};
