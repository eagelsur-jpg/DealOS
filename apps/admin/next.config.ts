import type { NextConfig } from 'next';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: join(currentDir, '../../'),
  transpilePackages: ['@dealos/ui', '@dealos/types', '@dealos/utils', '@dealos/database']
};

export default nextConfig;
