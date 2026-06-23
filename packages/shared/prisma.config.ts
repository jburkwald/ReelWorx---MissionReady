// Prisma 7 CLI config (generate / migrate / db push / studio).
//
// Prisma 7 no longer auto-loads .env, so we load it here, and the DB connection
// URL lives here (and in app code via the pg adapter) instead of in schema.prisma.

import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  // Driver adapter for CLI commands that connect to the database.
  async adapter() {
    const { PrismaPg } = await import('@prisma/adapter-pg');
    return new PrismaPg({ connectionString: process.env.DATABASE_URL });
  },
});
