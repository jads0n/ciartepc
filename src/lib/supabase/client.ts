import { createClient } from '@supabase/supabase-js';

// Credenciais públicas (anon key) — seguras para uso no frontend
// Também lidas de variáveis de ambiente quando disponíveis (Vercel, etc.)
const SUPABASE_URL = 'https://rebecwcopqlnnrvthvgi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8yHzNOTTKXFdKUsviknRJA_WeemMCGe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  // Sempre configurado — credenciais estão embutidas como fallback seguro
  return true;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
