import { adminEnvSchema } from '@dealos/config';
import { validateRuntimeEnv } from '@dealos/utils';

export const getAdminEnv = () => validateRuntimeEnv(adminEnvSchema);
