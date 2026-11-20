import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const env = import.meta.env as Record<string, string | undefined>;
  const supabaseUrl =
    env.VITE_SUPABASE_URL ??
    env.NEXT_PUBLIC_SUPABASE_URL ??
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined);

  const supabaseKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    env.VITE_SUPABASE_ANON_KEY ??
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    (typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : undefined);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase URL or Publishable/Anon key in environment variables.'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
