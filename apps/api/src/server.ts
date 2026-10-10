import 'dotenv/config';
import { serve } from '@hono/node-server';
import { logger } from '@dealos/utils';
import { createApp } from './app.js';
import { createDependencies } from './dependencies.js';
import { apiEnv } from './env.js';

const app = createApp(await createDependencies(), {
  adminJwtSecret: apiEnv.ADMIN_JWT_SECRET,
  corsOrigins: apiEnv.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
});

serve(
  {
    fetch: app.fetch,
    port: apiEnv.API_PORT
  },
  (info) => {
    logger.info(`API server running on http://localhost:${info.port}`);
  },
);
