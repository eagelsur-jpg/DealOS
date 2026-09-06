import { validateEnv } from '@dealos/config';
import type { z } from 'zod';

export const validateRuntimeEnv = <T extends z.ZodTypeAny>(
  schema: T,
  env: Record<string, unknown> = process.env,
): z.infer<T> => validateEnv(schema, env);
