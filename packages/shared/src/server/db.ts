// Prisma client singleton — SERVER ONLY.
//
// Imported by the web app's server code and any API/route handlers. Never reaches
// the mobile bundle (mobile imports only from @reelworx/shared, which excludes this).
// The singleton guard prevents exhausting DB connections during dev hot-reload.
//
// Prisma 7: the connection URL is provided in application code via the pg driver
// adapter (no `url` in schema.prisma). The client is imported from the generated
// output (src/generated/prisma), not '@prisma/client'.

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — required for the Prisma pg adapter.');
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['error'],
  });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-export generated Prisma types/enums for server consumers so they don't reach
// into the generated path directly (keeps a single seam we control).
export * from '../generated/prisma/client';
