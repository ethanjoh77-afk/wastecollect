import { supabase } from '../lib/supabase';

export interface WardOption {
  id: string;
  name: string;
}

export interface CompanyOption {
  id: string;
  name: string;
}

/** Kata ambazo kampuni inazihudumia. */
export async function getCompanyWardIds(companyId: string): Promise<string[]> {
  const { data, error } = await supabase.from('company_wards').select('ward_id').eq('company_id', companyId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { ward_id: string }) => r.ward_id);
}

/** Super admin anaipa kampuni kata zake (RPC ya database). */
export async function setCompanyWards(companyId: string, wardIds: string[]) {
  const { error } = await supabase.rpc('set_company_wards', { p_company: companyId, p_ward_ids: wardIds });
  if (error) throw new Error(error.message || 'Imeshindikana kuhifadhi kata za kampuni.');
}

/** Kampuni zinazohudumia kata fulani. */
export async function companiesForWard(wardId: string): Promise<CompanyOption[]> {
  const { data, error } = await supabase.rpc('companies_for_ward', { p_ward: wardId });
  if (error) throw new Error(error.message);
  return (data ?? []) as CompanyOption[];
}

/** Kuelekeza ripoti isiyo na kampuni kwa kampuni husika. */
export async function assignReportCompany(reportId: string, companyId: string) {
  const { error } = await supabase.rpc('assign_report_company', { p_report: reportId, p_company: companyId });
  if (error) throw new Error(error.message || 'Imeshindikana kuelekeza ripoti.');
}

export async function listAllWards(): Promise<WardOption[]> {
  const { data, error } = await supabase.from('wards').select('id, name').eq('is_active', true).order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as WardOption[];
}
