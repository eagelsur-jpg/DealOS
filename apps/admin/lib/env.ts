import { adminEnvSchema, validateEnv } from '@dealos/config';

export const getAdminEnv = () => validateEnv(adminEnvSchema, process.env);
