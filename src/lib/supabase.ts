import { createClient } from '@supabase/supabase-js';

// Default / fallback keys or localStorage overrides
export const getSupabaseConfig = () => {
  const localUrl = localStorage.getItem('resik_supabase_url');
  const localKey = localStorage.getItem('resik_supabase_anon_key');

  const supabaseUrl = localUrl || import.meta.env.VITE_SUPABASE_URL || 'https://sample-project.supabase.co';
  const supabaseAnonKey = localKey || import.meta.env.VITE_SUPABASE_ANON_KEY || 'sample-anon-key';

  return { supabaseUrl, supabaseAnonKey, isConfigured: Boolean(localUrl || import.meta.env.VITE_SUPABASE_URL) };
};

const config = getSupabaseConfig();
export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('resik_supabase_url', url);
  localStorage.setItem('resik_supabase_anon_key', key);
  window.location.reload();
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('resik_supabase_url');
  localStorage.removeItem('resik_supabase_anon_key');
  window.location.reload();
};
