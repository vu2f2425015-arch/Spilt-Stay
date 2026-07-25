import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('https://')
);

// The RLS policies in supabase/schema.sql key every row to
// auth.jwt() ->> 'sub' (the Clerk user id). For that to work, every
// request Supabase receives has to carry a valid Clerk session token.
// Supabase JS v2 supports this natively via the `accessToken` client
// option ("Third-Party Auth" - no Supabase JWT template required),
// but it needs a way to reach into Clerk's session from outside React.
//
// App.tsx calls `setClerkTokenGetter` once it has access to Clerk's
// `getToken()` (via the `useAuth` hook), and every Supabase request
// after that calls back into Clerk to fetch a fresh token.
//
// IMPORTANT (one-time setup in the Supabase dashboard):
// Authentication -> Sign In / Providers -> Third Party Auth -> add Clerk,
// using your Clerk instance's domain. See README.md for the full steps.
let clerkTokenGetter: (() => Promise<string | null>) | null = null;

export const setClerkTokenGetter = (getter: (() => Promise<string | null>) | null) => {
  clerkTokenGetter = getter;
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      accessToken: async () => {
        if (!clerkTokenGetter) return null;
        try {
          return (await clerkTokenGetter()) ?? null;
        } catch (err) {
          console.warn('Failed to fetch Clerk token for Supabase request:', err);
          return null;
        }
      },
    })
  : null;
