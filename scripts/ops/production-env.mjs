import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
const require = createRequire('/root/DealOS/packages/database/package.json');
const { parse } = require('dotenv');
export function productionEnv(app) {
  const env = { ...process.env };
  const directories = ['/root/DealOS', `/root/DealOS/apps/${app}`, `/root/DealOS-review/apps/${app}`];
  for (const directory of directories) for (const name of ['.env', '.env.local']) {
    const path = `${directory}/${name}`;
    if (existsSync(path)) Object.assign(env, parse(readFileSync(path)));
  }
  Object.assign(env, { NODE_ENV: 'production', API_PORT: '3004',
    API_INTERNAL_URL: 'http://127.0.0.1:3004', ADMIN_INTERNAL_URL: 'http://127.0.0.1:3003', WEB_INTERNAL_URL: 'http://127.0.0.1:3002' });
  return env;
}
