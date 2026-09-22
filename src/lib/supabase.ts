import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Environment variables
const rawSupabaseUrl = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  ''
).trim();

const rawSupabaseAnonKey = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  ''
).trim();

/**
 * Normalizes user-provided Supabase URLs or project references.
 * Formats inputs like:
 * - 'xmcqbrokuhswhirlhrip' -> 'https://xmcqbrokuhswhirlhrip.supabase.co'
 * - 'xmcqbrokuhswhirlhrip.supabase.co' -> 'https://xmcqbrokuhswhirlhrip.supabase.co'
 * - 'https://xmcqbrokuhswhirlhrip.supabase.co' -> 'https://xmcqbrokuhswhirlhrip.supabase.co'
 */
function normalizeSupabaseUrl(url: string): string {
  if (!url) return 'https://placeholder-project.supabase.co';
  let formatted = url.trim();
  if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
    if (!formatted.includes('.')) {
      formatted = `https://${formatted}.supabase.co`;
    } else {
      formatted = `https://${formatted}`;
    }
  }
  try {
    new URL(formatted);
    return formatted;
  } catch {
    return 'https://placeholder-project.supabase.co';
  }
}

export const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
export const supabaseAnonKey = rawSupabaseAnonKey || 'placeholder-anon-key';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    rawSupabaseUrl &&
    rawSupabaseAnonKey &&
    !supabaseUrl.includes('placeholder-project.supabase.co') &&
    rawSupabaseUrl !== 'https://your-project.supabase.co' &&
    rawSupabaseAnonKey !== 'your-anon-key'
  );
};

function initSupabaseClient(): SupabaseClient {
  try {
    return createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      }
    );
  } catch (err) {
    console.warn('Failed to initialize Supabase client with provided credentials. Falling back to placeholder.', err);
    return createClient(
      'https://placeholder-project.supabase.co',
      'placeholder-anon-key'
    );
  }
}

/**
 * Supabase client instance.
 * For production, configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.
 */
export const supabase: SupabaseClient = initSupabaseClient();
