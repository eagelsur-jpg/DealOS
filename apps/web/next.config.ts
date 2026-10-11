import type { NextConfig } from 'next';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotEnv } from 'dotenv';

const currentDir = dirname(fileURLToPath(import.meta.url));
loadDotEnv({ path: join(currentDir, '.env.local'), override: false });
loadDotEnv({ path: join(currentDir, '.env'), override: false });
loadDotEnv({ path: join(currentDir, '../../.env.local'), override: false });
loadDotEnv({ path: join(currentDir, '../../.env'), override: false });

const nextConfig: NextConfig = {
  outputFileTracingRoot: join(currentDir, '../../'),
  transpilePackages: [
    '@dealos/ui',
    '@dealos/types',
    '@dealos/utils',
    '@dealos/ai',
    '@dealos/database',
  ],
  images: { unoptimized: true },
};

export default nextConfig;
