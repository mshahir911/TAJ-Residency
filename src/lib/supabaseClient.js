import { createClient } from '@supabase/supabase-js';

const getStoredConfig = () => {
  if (typeof window === 'undefined') return { url: '', key: '' };
  try {
    return {
      url: localStorage.getItem('taj_custom_supabase_url') || '',
      key: localStorage.getItem('taj_custom_supabase_key') || ''
    };
  } catch (e) {
    return { url: '', key: '' };
  }
};

const stored = getStoredConfig();
const DEFAULT_URL = 'https://cdhrpaunmcyknmrcvqdg.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkaHJwYXVubWN5a25tcmN2cWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxODgzMjgsImV4cCI6MjEwMTc2NDMyOH0.5tk15WpxjRgZqlXki1II_EENnm21Bb1FgT0evsOWMXk';

export let supabaseUrl = 
  stored.url || 
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.NEXT_PUBLIC_SUPABASE_URL)) || 
  DEFAULT_URL;

export let supabaseAnonKey = 
  stored.key || 
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY)) || 
  DEFAULT_KEY;

export const isSupabaseConfigured = Boolean(
  (stored.url && stored.key) ||
  (typeof import.meta !== 'undefined' && 
   (import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.NEXT_PUBLIC_SUPABASE_URL)) ||
  DEFAULT_URL
);

export let supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export function saveCustomSupabaseConfig(url, key) {
  if (typeof window === 'undefined') return;
  try {
    if (url && key) {
      localStorage.setItem('taj_custom_supabase_url', url.trim());
      localStorage.setItem('taj_custom_supabase_key', key.trim());
      supabaseUrl = url.trim();
      supabaseAnonKey = key.trim();
    } else {
      localStorage.removeItem('taj_custom_supabase_url');
      localStorage.removeItem('taj_custom_supabase_key');
      supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo-taj-residency.supabase.co';
      supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.demo-key';
    }

    // Recreate client with new credentials
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });

    return true;
  } catch (e) {
    console.error('Storage save error:', e);
    return false;
  }
}
