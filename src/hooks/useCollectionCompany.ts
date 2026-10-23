import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { isNetworkError } from '../lib/offlineQueue';

export interface CollectionCompany {
  id: string;
  name: string;
}

const STORAGE_KEY = 'wc_collect_company';

/**
 * Kampuni inayotumika kwenye ukusanyaji:
 *  - collector      -> kampuni aliyopangiwa (collectors.company_id)
 *  - company_admin  -> kampuni(zake) ambazo ni admin_id
 *  - super_admin    -> anachagua kampuni yoyote
 */
export function useCollectionCompany() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CollectionCompany[]>([]);
  const [companyId, setCompanyIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        let list: CollectionCompany[] = [];

        if (user!.role === 'collector') {
          const { data, error: e } = await supabase
            .from('collectors')
            .select('company_id, is_active, companies(id, name)')
            .eq('user_id', user!.id)
            .maybeSingle();
          if (e) throw e;
          const row = data as unknown as { is_active: boolean; companies: CollectionCompany | null } | null;
          const c = row?.companies;
          if (row && !row.is_active) {
            setError('Akaunti yako ya mkusanyaji imezimwa. Wasiliana na msimamizi.');
          } else if (c) {
            list = [{ id: c.id, name: c.name }];
          } else {
            setError('Bado hujapangiwa kampuni. Wasiliana na msimamizi akuongeze kama mkusanyaji.');
          }
        } else {
          let q = supabase.from('companies').select('id, name').order('name');
          if (user!.role === 'company_admin') q = q.eq('admin_id', user!.id);
          const { data, error: e } = await q;
          if (e) throw e;
          list = (data ?? []) as CollectionCompany[];
          if (list.length === 0) setError('Hakuna kampuni iliyounganishwa na akaunti yako.');
        }

        if (cancelled) return;
        setCompanies(list);
        const saved = localStorage.getItem(STORAGE_KEY);
        const initial = list.find((c) => c.id === saved)?.id ?? list[0]?.id ?? null;
        setCompanyIdState(initial);
        if (initial) localStorage.setItem(STORAGE_KEY, initial);
      } catch (err) {
        if (cancelled) return;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && isNetworkError(err)) {
          // Offline: tumia kampuni iliyohifadhiwa mara ya mwisho
          setCompanies([{ id: saved, name: 'Kampuni yangu' }]);
          setCompanyIdState(saved);
        } else {
          setError((err as Error).message || 'Imeshindikana kupakia kampuni.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const setCompanyId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setCompanyIdState(id);
  }, []);

  return { companies, companyId, setCompanyId, loading, error };
}
