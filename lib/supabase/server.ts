import { createServerClient, parseCookieHeader, serializeCookieHeader, type CookieMethodsServer } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Request, Response } from 'express';

function getSupabaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.');
  }
  return url;
}

function getSupabasePublicKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.'
    );
  }
  return key;
}

export function createClient(context?: {
  req?: Request;
  res?: Response;
  cookies?: CookieMethodsServer;
}) {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublicKey();

  const cookies: CookieMethodsServer = context?.cookies ?? {
    getAll() {
      const cookieHeader = context?.req?.headers.cookie ?? '';
      return parseCookieHeader(cookieHeader).map((c) => ({
        name: c.name,
        value: c.value ?? '',
      }));
    },
    setAll(cookiesToSet) {
      if (!context?.res) return;
      cookiesToSet.forEach(({ name, value, options }) => {
        context.res!.appendHeader(
          'Set-Cookie',
          serializeCookieHeader(name, value, options)
        );
      });
    },
  };

  return createServerClient(supabaseUrl, supabaseKey, { cookies });
}

export function createAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
