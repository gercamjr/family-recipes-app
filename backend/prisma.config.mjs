import { defineConfig, env } from 'prisma/config';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables, prioritizing the repo-root .env.local (../.env.local)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
// Then load any .env in the current working directory (e.g., backend/.env) to allow overrides
dotenv.config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
