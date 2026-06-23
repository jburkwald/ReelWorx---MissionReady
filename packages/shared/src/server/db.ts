// Prisma client singleton — SERVER ONLY.
//
// Imported by the web app's server code and route handlers; never reaches the mobile
// bundle. The client is created LAZILY (on first property access via a Proxy) so that
// importing this module is side-effect-free — apps can build/boot without DATABASE_URL,
// and the "missing DATABASE_URL" error only surfaces when a query is actually run.
//
// Prisma 7: connection URL is provided in app code via the pg driver adapter (no `url`
// in schema.prisma); the client is imported from the generated output, not '@prisma/client'.

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set — required for the Prisma pg adapter. Add it to .env.',
    );
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

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrisma();
  }
  return globalForPrisma.prisma;
}

// Lazy proxy: forwards every access to the real client, instantiating it on first use.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

// Re-export generated Prisma types/enums for server consumers.
export * from '../generated/prisma/client';
