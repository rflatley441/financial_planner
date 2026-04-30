import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const repoRoot = path.resolve(__dirname, '..');
  const fromRoot = loadEnv(mode, repoRoot, '');
  const fromClient = loadEnv(mode, __dirname, '');
  /** First non-empty wins; earlier keys beat later (client dir beats repo root per key). */
  const pickFirst = (...keys: string[]) => {
    for (const key of keys) {
      const v = ((fromClient[key] ?? fromRoot[key]) ?? '') as string
      const t = v.trim()
      if (t) return t
    }
    return ''
  }

  return {
    // Map into VITE_* so app code stays consistent. Supabase "Connect" for Next.js uses NEXT_PUBLIC_* names — those work too.
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
        pickFirst('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'),
      ),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        pickFirst(
          'VITE_SUPABASE_ANON_KEY',
          'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
          'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        ),
      ),
    },
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    /** Same proxy for `vite preview` so `/api/plaid/*` reaches the Node server. */
    preview: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
