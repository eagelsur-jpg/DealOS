import { apiEnvSchema } from '@dealos/config';
import { validateRuntimeEnv } from '@dealos/utils';

export const apiEnv = validateRuntimeEnv(apiEnvSchema);
