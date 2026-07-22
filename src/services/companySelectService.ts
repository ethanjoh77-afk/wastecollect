import { supabase } from '../lib/supabase';

/** Minimal company list (id + name) for populating <select> dropdowns. */
export async function listCompaniesForSelect(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from('companies').select('id, name').order('name');
  if (error) throw error;
  return data ?? [];
}
