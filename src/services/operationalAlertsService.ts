import { supabase } from '../lib/supabase';

/**
 * GPS-as-decision-support (Swali #7): badala ya "GPS -> Map" tu, hapa tuna
 * "GPS -> Detection -> Alert -> Action". Pia dispatch linking (Swali #5):
 * "Report -> Assignment -> Dispatch -> Collection -> Proof -> Closure".
 */

export interface VehicleAlert {
  id: string;
  company_id: string;
  vehicle_id: string;
  route_id: string | null;
  alert_type: 'stale_location' | 'off_route_stopped' | 'missed_stop_delay';
  message: string;
  is_resolved: boolean;
  created_at: string;
}

const STALE_LOCATION_MINUTES = 20;

/**
 * Detection pass: inatafuta magari yaliyo "on_route" lakini hayajatuma
 * location update kwa zaidi ya STALE_LOCATION_MINUTES, na kutengeneza
 * vehicle_alerts kwa yale ambayo hayana alert isiyo-resolved tayari.
 * Piga hii mara kwa mara (mfano kila mara LiveMonitoringPage inapofunguliwa,
 * au kupitia scheduled Edge Function baadaye).
 */
export async function detectStaleVehicles(companyId?: string): Promise<VehicleAlert[]> {
  const cutoff = new Date(Date.now() - STALE_LOCATION_MINUTES * 60 * 1000).toISOString();

  let query = supabase
    .from('vehicles')
    .select('id, company_id, registration_number, last_location_update, status')
    .eq('status', 'on_route');

  if (companyId) query = query.eq('company_id', companyId);

  const { data: vehicles, error } = await query;
  if (error) throw error;

  const staleVehicles = (vehicles ?? []).filter(
    (v: { last_location_update: string | null }) => !v.last_location_update || v.last_location_update < cutoff
  );

  const created: VehicleAlert[] = [];

  for (const v of staleVehicles as { id: string; company_id: string; registration_number: string }[]) {
    const { data: existing } = await supabase
      .from('vehicle_alerts')
      .select('id')
      .eq('vehicle_id', v.id)
      .eq('alert_type', 'stale_location')
      .eq('is_resolved', false)
      .maybeSingle();

    if (existing) continue;

    const { data: inserted, error: insertError } = await supabase
      .from('vehicle_alerts')
      .insert({
        company_id: v.company_id,
        vehicle_id: v.id,
        alert_type: 'stale_location',
        message: `Gari ${v.registration_number} halijatuma location update kwa zaidi ya dakika ${STALE_LOCATION_MINUTES} likiwa bado "on route".`,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    created.push(inserted as VehicleAlert);
  }

  return created;
}

export async function listUnresolvedAlerts(companyId?: string): Promise<VehicleAlert[]> {
  let query = supabase
    .from('vehicle_alerts')
    .select('*')
    .eq('is_resolved', false)
    .order('created_at', { ascending: false });

  if (companyId) query = query.eq('company_id', companyId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as VehicleAlert[];
}

export async function resolveAlert(alertId: string): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id ?? null;

  const { error } = await supabase
    .from('vehicle_alerts')
    .update({ is_resolved: true, resolved_by: userId, resolved_at: new Date().toISOString() })
    .eq('id', alertId);

  if (error) throw error;
}

/**
 * Dispatch linking (Swali #5): unapoteua route + gari kwa ripoti ya
 * missed_collection, hii inaunganisha waste_reports moja kwa moja na
 * dispatch halisi, na kubadilisha status kuwa "in_review".
 */
export async function assignReportToDispatch(
  reportId: string,
  routeId: string,
  vehicleId: string
): Promise<void> {
  const { error } = await supabase
    .from('waste_reports')
    .update({
      route_id: routeId,
      vehicle_id: vehicleId,
      dispatched_at: new Date().toISOString(),
      status: 'in_review',
    })
    .eq('id', reportId);

  if (error) throw error;
}
