import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Transpile the workspace package (it ships raw TypeScript source).
  transpilePackages: ['@reelworx/shared'],
  // Keep server-only / native deps out of the client bundle. These are only ever
  // reached through @reelworx/shared/server in server components & route handlers.
  serverExternalPackages: [
    '@prisma/client',
    '@prisma/adapter-pg',
    'pg',
    '@mux/mux-node',
    '@supabase/supabase-js',
  ],
};

export default nextConfig;
