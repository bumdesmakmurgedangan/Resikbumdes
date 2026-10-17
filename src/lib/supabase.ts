import { createClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://irtcdthxhilloeekcfsp.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_rACSs91lXxWcrLhP5Ni9mA_JDzpfkph';

// Default / fallback keys or localStorage overrides
export const getSupabaseConfig = () => {
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('resik_supabase_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('resik_supabase_anon_key') : null;

  const supabaseUrl = localUrl || import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = localKey || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  return { 
    supabaseUrl, 
    supabaseAnonKey, 
    isConfigured: Boolean(supabaseUrl && supabaseUrl !== 'https://sample-project.supabase.co')
  };
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

