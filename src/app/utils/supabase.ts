// Supabase client for frontend
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

// FIX: Custom storage that writes to BOTH cookies and localStorage
// Safari ITP wipes localStorage but not first-party cookies
const COOKIE_NAME = 'stoix_auth';
const COOKIE_DAYS = 365;

const cookieStorage = {
  getItem: (key: string): string | null => {
    // Try localStorage first
    try {
      const local = localStorage.getItem(key);
      if (local) return local;
    } catch {}

    // Fall back to cookies
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [k, v] = cookie.trim().split('=');
        if (k === encodeURIComponent(key)) {
          return decodeURIComponent(v);
        }
      }
    } catch {}

    return null;
  },

  setItem: (key: string, value: string): void => {
    // Write to localStorage
    try {
      localStorage.setItem(key, value);
    } catch {}

    // Also write to cookie (365 day expiry, first-party so Safari won't wipe it)
    try {
      const expires = new Date();
      expires.setDate(expires.getDate() + COOKIE_DAYS);
      document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    } catch {}
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {}

    try {
      document.cookie = `${encodeURIComponent(key)}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
    } catch {}
  },
};

// Create a singleton Supabase client
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: cookieStorage, // FIX: Use cookie-backed storage so Safari ITP can't wipe it
    }
  }
);

// Helper to get current session
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
}

// Helper to get current user
export async function getCurrentUser() {
  const session = await getCurrentSession();
  if (!session) return null;
  
  const { data: { user }, error } = await supabase.auth.getUser(session.access_token);
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
}

// Helper to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return !!session;
}

// Helper to get access token
export async function getAccessToken(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.access_token || null;
}
