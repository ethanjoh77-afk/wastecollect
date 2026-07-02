import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase credentials hazipo. Hakikisha VITE_SUPABASE_URL na VITE_SUPABASE_ANON_KEY zimewekwa kwenye .env (au environment variables za production/hosting).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);