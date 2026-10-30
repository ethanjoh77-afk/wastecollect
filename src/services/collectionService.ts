/* eslint-disable @typescript-eslint/no-explicit-any -- hesabu za numeric kutoka PostgREST zinahitaji ramani ya aina */
import { supabase } from '../lib/supabase';
import {
  enqueue,
  getQueue,
  isNetworkError,
  newClientUuid,
  removeFromQueue,
  updateQueueItem,
} from '../lib/offlineQueue';
import type {
  AreaSummaryRow,
  CollectorRow,
  DebtorRow,
  FeePlan,
  OccupantBalance,
  PayMethod,
  PaymentReceipt,
  PropertyMapRow,
  PropertyType,
  RegisterPropertyInput,
  RegisterPropertyResult,
  ShiftRow,
  Street,
  UnitPayment,
  UnitStatusRow,
  UnitType,
  Ward,
} from '../types/collection.types';

const num = (v: unknown): number => (v === null || v === undefined ? 0 : Number(v));

function fail(error: { message?: string } | null, fallback: string): never {
  throw new Error(error?.message || fallback);
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

/** Mwanzo wa siku ya leo (saa za Tanzania, UTC+3) kama ISO string. */
export function startOfTodayTz(): string {
  const now = new Date();
  const eat = new Date(now.getTime() + 3 * 3600 * 1000);
  eat.setUTCHours(0, 0, 0, 0);
  return new Date(eat.getTime() - 3 * 3600 * 1000).toISOString();
}

/* ============================ KUTAFUTA KITENGO ============================ */

function mapUnit(r: any): UnitStatusRow {
  return { ...r, balance: r.balance === null ? null : num(r.balance) } as UnitStatusRow;
}

export async function getUnitByCode(code: string): Promise<UnitStatusRow | null> {
  const { data, error } = await supabase
    .from('v_unit_status')
    .select('*')
    .eq('code', normalizeCode(code))
    .maybeSingle();
  if (error) fail(error, 'Imeshindikana kutafuta code.');
  return data ? mapUnit(data) : null;
}

export async function listPropertyUnits(propertyId: string): Promise<UnitStatusRow[]> {
  const { data, error } = await supabase
    .from('v_unit_status')
    .select('*')
    .eq('property_id', propertyId)
    .order('code');
  if (error) fail(error, 'Imeshindikana kupakia vitengo.');
  return (data ?? []).map(mapUnit);
}

export async function getUnitPayments(unitId: string, limit = 8): Promise<UnitPayment[]> {
  const { data, error } = await supabase
    .from('unit_payments')
    .select('*')
    .eq('billing_unit_id', unitId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) fail(error, 'Imeshindikana kupakia malipo.');
  return (data ?? []).map((p: any) => ({ ...p, amount: num(p.amount) })) as UnitPayment[];
}

export async function getUnitOccupants(unitId: string): Promise<OccupantBalance[]> {
  const { data, error } = await supabase
    .from('v_occupant_balances')
    .select('*')
    .eq('billing_unit_id', unitId)
    .order('moved_in', { ascending: false });
  if (error) fail(error, 'Imeshindikana kupakia wakazi.');
  return (data ?? []).map((o: any) => ({
    ...o,
    billed: num(o.billed),
    paid: num(o.paid),
    balance: num(o.balance),
  })) as OccupantBalance[];
}

/* ================================ MALIPO ================================= */

export interface RecordPaymentInput {
  code: string;
  amount: number;
  method: PayMethod;
  clientUuid?: string;
  ref?: string | null;
  payerName?: string;
  balanceBefore?: number | null;
}

export async function recordPayment(input: RecordPaymentInput): Promise<PaymentReceipt> {
  const clientUuid = input.clientUuid ?? newClientUuid();
  const { data, error } = await supabase.rpc('record_payment', {
    p_unit_code: normalizeCode(input.code),
    p_amount: input.amount,
    p_method: input.method,
    p_client_uuid: clientUuid,
    p_ref: input.ref ?? null,
  });
  if (error) throw error;
  const p = data as any;
  return {
    receipt_no: p.receipt_no,
    amount: num(p.amount),
    method: p.method,
    created_at: p.created_at,
    code: normalizeCode(input.code),
    payer_name: input.payerName ?? '',
    balance_after:
      input.balanceBefore === null || input.balanceBefore === undefined
        ? null
        : input.balanceBefore - num(p.amount),
  };
}

/** Jaribu mtandaoni; ukikosa mtandao, hifadhi kwenye foleni na urudishe risiti ya muda. */
export async function recordPaymentOrQueue(input: RecordPaymentInput): Promise<PaymentReceipt> {
  const clientUuid = input.clientUuid ?? newClientUuid();
  try {
    return await recordPayment({ ...input, clientUuid });
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    enqueue({
      id: clientUuid,
      kind: 'payment',
      label: `${normalizeCode(input.code)} — TZS ${input.amount.toLocaleString()}`,
      payload: {
        code: normalizeCode(input.code),
        amount: input.amount,
        method: input.method,
        ref: input.ref ?? null,
        payerName: input.payerName ?? '',
      },
    });
    return {
      receipt_no: `MUDA-${clientUuid.slice(0, 6).toUpperCase()}`,
      amount: input.amount,
      method: input.method,
      created_at: new Date().toISOString(),
      code: normalizeCode(input.code),
      payer_name: input.payerName ?? '',
      balance_after:
        input.balanceBefore === null || input.balanceBefore === undefined
          ? null
          : input.balanceBefore - input.amount,
      queued: true,
    };
  }
}

export async function reversePayment(paymentId: string, reason: string) {
  const { error } = await supabase.rpc('reverse_payment', {
    p_payment_id: paymentId,
    p_reason: reason,
  });
  if (error) fail(error, 'Imeshindikana kurekebisha malipo.');
}

export async function getMyPaymentsToday(userId: string): Promise<UnitPayment[]> {
  const { data, error } = await supabase
    .from('unit_payments')
    .select('*')
    .eq('collected_by', userId)
    .gte('created_at', startOfTodayTz())
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) fail(error, 'Imeshindikana kupakia malipo ya leo.');
  return (data ?? []).map((p: any) => ({ ...p, amount: num(p.amount) })) as UnitPayment[];
}

/* ============================== USAJILI NYUMBA ============================ */

export async function registerProperty(input: RegisterPropertyInput): Promise<RegisterPropertyResult> {
  const { data, error } = await supabase.rpc('register_property', {
    p_client_uuid: input.client_uuid,
    p_company: input.company_id,
    p_ward: input.ward_id,
    p_street: input.street_id,
    p_type: input.property_type,
    p_owner_name: input.owner_name,
    p_owner_phone: input.owner_phone,
    p_total_rooms: input.total_rooms,
    p_address: input.address,
    p_lat: input.lat,
    p_lng: input.lng,
    p_units: input.units,
  });
  if (error) throw error;
  const result = data as RegisterPropertyResult;
  await applyOpeningBalancesAfterRegister(input, result);
  return result;
}

/** Deni la nyuma / alichokwisha lipa kwa kila kichwa kilichosajiliwa (kupitia ledger). */
async function applyOpeningBalancesAfterRegister(input: RegisterPropertyInput, result: RegisterPropertyResult) {
  for (let i = 0; i < input.units.length; i++) {
    const op = input.units[i].opening;
    const reg = result.units?.[i];
    if (!op || !reg || (!op.debt && !op.paid)) continue;
    try {
      const u = await getUnitByCode(reg.code);
      if (!u?.occupant_id) continue;
      await applyOpeningBalance(u.occupant_id, op.debt, op.paid);
    } catch (e) {
      console.error('Opening balance failed for', reg.code, e);
    }
  }
}

/** Usajili wa offline: ukikosa mtandao unaingia kwenye foleni (returns null). */
export async function registerPropertyOrQueue(
  input: RegisterPropertyInput
): Promise<RegisterPropertyResult | null> {
  try {
    return await registerProperty(input);
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    enqueue({
      id: input.client_uuid,
      kind: 'property',
      label: `${input.owner_name || input.address || 'Nyumba mpya'} (${input.units.length} vichwa)`,
      payload: input as unknown as Record<string, unknown>,
    });
    return null;
  }
}

export async function listWards(): Promise<Ward[]> {
  const { data, error } = await supabase.from('wards').select('id, name').eq('is_active', true).order('name');
  if (error) fail(error, 'Imeshindikana kupakia kata.');
  return (data ?? []) as Ward[];
}

export async function listStreets(wardId: string): Promise<Street[]> {
  const { data, error } = await supabase
    .from('streets')
    .select('id, ward_id, name')
    .eq('ward_id', wardId)
    .eq('is_active', true)
    .order('name');
  if (error) fail(error, 'Imeshindikana kupakia mitaa.');
  return (data ?? []) as Street[];
}

export interface PropertyRow {
  id: string;
  company_id: string;
  ward_id: string | null;
  property_type: PropertyType;
  owner_name: string | null;
  owner_phone: string | null;
  total_rooms: number | null;
  address: string | null;
  location_lat: number | null;
  location_lng: number | null;
}

export async function getProperty(propertyId: string): Promise<PropertyRow | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .maybeSingle();
  if (error) fail(error, 'Imeshindikana kupakia nyumba.');
  return (data as PropertyRow | null) ?? null;
}

export async function addUnitToProperty(args: {
  propertyId: string;
  unitType: UnitType;
  label: string;
  occupant?: { full_name: string; phone?: string; household_size?: number | null } | null;
}) {
  const { data: unit, error } = await supabase
    .from('billing_units')
    .insert({ property_id: args.propertyId, unit_type: args.unitType, label: args.label || null })
    .select('id, code')
    .single();
  if (error) fail(error, 'Imeshindikana kuongeza kichwa.');
  if (args.occupant?.full_name) {
    const { error: occErr } = await supabase.from('occupants').insert({
      billing_unit_id: unit.id,
      full_name: args.occupant.full_name,
      phone: args.occupant.phone || null,
      household_size: args.occupant.household_size ?? null,
    });
    if (occErr) fail(occErr, 'Kichwa kimeongezwa lakini mkazi ameshindwa kuhifadhiwa.');
  }
  return unit as { id: string; code: string };
}

export async function addOccupant(args: {
  unitId: string;
  fullName: string;
  phone?: string;
  householdSize?: number | null;
}) {
  const { error } = await supabase.from('occupants').insert({
    billing_unit_id: args.unitId,
    full_name: args.fullName,
    phone: args.phone || null,
    household_size: args.householdSize ?? null,
  });
  if (error) fail(error, 'Imeshindikana kuongeza mkazi.');
}

export async function moveOutOccupant(occupantId: string, date?: string) {
  const { error } = await supabase.rpc('move_out_occupant', {
    p_occupant_id: occupantId,
    p_date: date ?? new Date().toISOString().slice(0, 10),
  });
  if (error) fail(error, 'Imeshindikana kumtoa mkazi.');
}

/* ================================= RAMANI ================================ */

export async function listPropertyMap(): Promise<PropertyMapRow[]> {
  const { data, error } = await supabase
    .from('v_property_map')
    .select('*')
    .not('location_lat', 'is', null)
    .not('location_lng', 'is', null);
  if (error) fail(error, 'Imeshindikana kupakia ramani.');
  return (data ?? []).map((r: any) => ({
    ...r,
    location_lat: Number(r.location_lat),
    location_lng: Number(r.location_lng),
    units_occupied: num(r.units_occupied),
    units_paid: num(r.units_paid),
    units_partial: num(r.units_partial),
    units_unpaid: num(r.units_unpaid),
    total_debt: num(r.total_debt),
  })) as PropertyMapRow[];
}

/* ============================ ADMIN: MAPATO/MADENI ======================= */

export async function getAreaSummary(companyId: string): Promise<AreaSummaryRow[]> {
  const { data, error } = await supabase.from('v_area_summary').select('*').eq('company_id', companyId);
  if (error) fail(error, 'Imeshindikana kupakia muhtasari wa maeneo.');
  return (data ?? []).map((r: any) => ({
    ...r,
    active_units: num(r.active_units),
    billed_this_month: num(r.billed_this_month),
    collected_this_month: num(r.collected_this_month),
    outstanding_total: num(r.outstanding_total),
  })) as AreaSummaryRow[];
}

export async function listDebtors(
  companyId: string,
  opts: { wardId?: string; onlyFormer?: boolean; limit?: number } = {}
): Promise<DebtorRow[]> {
  let q = supabase
    .from('v_debtors')
    .select('*')
    .eq('company_id', companyId)
    .order('balance', { ascending: false })
    .limit(opts.limit ?? 100);
  if (opts.wardId) q = q.eq('ward_id', opts.wardId);
  if (opts.onlyFormer) q = q.eq('is_current', false);
  const { data, error } = await q;
  if (error) fail(error, 'Imeshindikana kupakia wadaiwa.');
  return (data ?? []).map((r: any) => ({
    ...r,
    billed: num(r.billed),
    paid: num(r.paid),
    balance: num(r.balance),
  })) as DebtorRow[];
}

export async function generateCharges(companyId: string, period?: string) {
  const { data, error } = await supabase.rpc('generate_monthly_charges', {
    p_company: companyId,
    ...(period ? { p_period: period } : {}),
  });
  if (error) fail(error, 'Imeshindikana kutengeneza madeni ya mwezi.');
  const row = Array.isArray(data) ? data[0] : data;
  return {
    charges_created: num(row?.charges_created),
    units_without_fee_plan: num(row?.units_without_fee_plan),
  };
}

/* ================================== ADA ================================== */

export async function listFeePlans(companyId: string): Promise<FeePlan[]> {
  const { data, error } = await supabase
    .from('fee_plans')
    .select('*')
    .eq('company_id', companyId)
    .order('unit_type')
    .order('name');
  if (error) fail(error, 'Imeshindikana kupakia ada.');
  return (data ?? []).map((p: any) => ({ ...p, amount: num(p.amount) })) as FeePlan[];
}

export async function saveFeePlan(plan: {
  id?: string;
  company_id: string;
  name: string;
  unit_type: UnitType;
  amount: number;
  is_active: boolean;
}) {
  const row = {
    company_id: plan.company_id,
    name: plan.name.trim(),
    unit_type: plan.unit_type,
    amount: plan.amount,
    is_active: plan.is_active,
  };
  const { error } = plan.id
    ? await supabase.from('fee_plans').update(row).eq('id', plan.id)
    : await supabase.from('fee_plans').insert(row);
  if (error) fail(error, 'Imeshindikana kuhifadhi ada.');
}

/* ============================== WAKUSANYAJI ============================== */

export async function listCollectors(companyId: string): Promise<CollectorRow[]> {
  const { data, error } = await supabase.rpc('collector_performance', { p_company: companyId });
  if (error) fail(error, 'Imeshindikana kupakia wakusanyaji.');
  return ((data ?? []) as any[]).map((r) => ({
    ...r,
    ward_ids: r.ward_ids ?? [],
    collected_this_month: num(r.collected_this_month),
    payments_this_month: num(r.payments_this_month),
    cash_today: num(r.cash_today),
    properties_registered: num(r.properties_registered),
  })) as CollectorRow[];
}

export async function addCollector(companyId: string, email: string, wardIds: string[]) {
  const { error } = await supabase.rpc('add_collector', {
    p_company: companyId,
    p_email: email,
    p_ward_ids: wardIds,
  });
  if (error) fail(error, 'Imeshindikana kumwongeza mkusanyaji.');
}

export async function setCollectorActive(userId: string, active: boolean) {
  const { error } = await supabase.from('collectors').update({ is_active: active }).eq('user_id', userId);
  if (error) fail(error, 'Imeshindikana kubadili hali ya mkusanyaji.');
}

export async function setCollectorWards(userId: string, wardIds: string[]) {
  const { error: delErr } = await supabase.from('collector_wards').delete().eq('collector_id', userId);
  if (delErr) fail(delErr, 'Imeshindikana kubadili maeneo.');
  if (wardIds.length) {
    const { error } = await supabase
      .from('collector_wards')
      .insert(wardIds.map((ward_id) => ({ collector_id: userId, ward_id })));
    if (error) fail(error, 'Imeshindikana kubadili maeneo.');
  }
}

/* ============================== KUFUNGA SIKU ============================= */

export async function submitShift(declared: number, notes?: string): Promise<ShiftRow> {
  const { data, error } = await supabase.rpc('submit_shift', {
    p_declared: declared,
    p_notes: notes?.trim() || null,
  });
  if (error) fail(error, 'Imeshindikana kufunga siku.');
  const s = data as any;
  return { ...s, expected_cash: num(s.expected_cash), declared_cash: s.declared_cash === null ? null : num(s.declared_cash) };
}

export async function getMyShifts(userId: string, limit = 7): Promise<ShiftRow[]> {
  const { data, error } = await supabase
    .from('collector_shifts')
    .select('*')
    .eq('collector_id', userId)
    .order('shift_date', { ascending: false })
    .limit(limit);
  if (error) fail(error, 'Imeshindikana kupakia historia ya siku.');
  return (data ?? []).map((s: any) => ({
    ...s,
    expected_cash: num(s.expected_cash),
    declared_cash: s.declared_cash === null ? null : num(s.declared_cash),
  })) as ShiftRow[];
}

export async function listShifts(companyId: string, days = 14): Promise<ShiftRow[]> {
  const { data, error } = await supabase.rpc('list_shifts', { p_company: companyId, p_days: days });
  if (error) fail(error, 'Imeshindikana kupakia siku zilizofungwa.');
  return ((data ?? []) as any[]).map((s) => ({
    ...s,
    expected_cash: num(s.expected_cash),
    declared_cash: s.declared_cash === null ? null : num(s.declared_cash),
  })) as ShiftRow[];
}

export async function confirmShift(shiftId: string, notes?: string) {
  const { error } = await supabase.rpc('confirm_shift', { p_shift_id: shiftId, p_notes: notes ?? null });
  if (error) fail(error, 'Imeshindikana kuthibitisha.');
}

/* ============================== KUSYNC OFFLINE =========================== */

let flushing = false;

/** Tuma kazi zote za foleni. Inarudisha idadi iliyofanikiwa na iliyokataliwa na seva. */
export async function flushOfflineQueue(): Promise<{ synced: number; rejected: number; pending: number }> {
  if (flushing) return { synced: 0, rejected: 0, pending: getQueue().length };
  flushing = true;
  let synced = 0;
  let rejected = 0;
  try {
    for (const item of getQueue()) {
      if (item.failed_reason) continue;
      try {
        if (item.kind === 'payment') {
          const p = item.payload as any;
          await recordPayment({
            code: p.code,
            amount: p.amount,
            method: p.method,
            ref: p.ref,
            payerName: p.payerName,
            clientUuid: item.id,
          });
        } else {
          await registerProperty(item.payload as unknown as RegisterPropertyInput);
        }
        removeFromQueue(item.id);
        synced++;
      } catch (err) {
        if (isNetworkError(err)) {
          updateQueueItem(item.id, { attempts: item.attempts + 1 });
          break; // bado hakuna mtandao — acha, jaribu baadaye
        }
        updateQueueItem(item.id, {
          attempts: item.attempts + 1,
          failed_reason: (err as { message?: string })?.message || 'Imekataliwa na seva',
        });
        rejected++;
      }
    }
  } finally {
    flushing = false;
  }
  return { synced, rejected, pending: getQueue().filter((i) => !i.failed_reason).length };
}

/** Kata alizopangiwa mkusanyaji (tupu = kampuni nzima). */
export async function getMyWardIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('collector_wards').select('ward_id').eq('collector_id', userId);
  if (error) fail(error, 'Imeshindikana kupakia maeneo yako.');
  return (data ?? []).map((r: any) => r.ward_id as string);
}


/* ======================= KUHARIRI TAARIFA ZA KAYA (RPC) ====================== */

export async function updatePropertyInfo(args: {
  propertyId: string;
  ownerName: string;
  ownerPhone: string;
  totalRooms: number | null;
  address: string;
  lat: number | null;
  lng: number | null;
}) {
  const { error } = await supabase.rpc('update_property_info', {
    p_property: args.propertyId,
    p_owner_name: args.ownerName.trim(),
    p_owner_phone: args.ownerPhone.trim(),
    p_total_rooms: args.totalRooms,
    p_address: args.address.trim(),
    p_lat: args.lat,
    p_lng: args.lng,
  });
  if (error) fail(error, 'Imeshindikana kuhifadhi taarifa za nyumba.');
}

export async function updateOccupantInfo(args: {
  occupantId: string;
  fullName: string;
  phone: string;
  householdSize: number | null;
}) {
  const { error } = await supabase.rpc('update_occupant_info', {
    p_occupant: args.occupantId,
    p_full_name: args.fullName.trim(),
    p_phone: args.phone.trim(),
    p_household_size: args.householdSize,
  });
  if (error) fail(error, 'Imeshindikana kuhifadhi taarifa za mkazi.');
}

export async function updateUnitLabel(unitId: string, label: string) {
  const { error } = await supabase.rpc('update_unit_label', { p_unit: unitId, p_label: label.trim() });
  if (error) fail(error, 'Imeshindikana kubadili jina la kichwa.');
}

/** "Badilisha mkazi": anamtoa wa zamani (deni lake linabaki kwenye historia yake) na kuingiza mpya. */
export async function replaceOccupant(args: {
  unitId: string;
  fullName: string;
  phone: string;
  householdSize: number | null;
  openingDebt: number;
  openingPaid: number;
}) {
  const { error } = await supabase.rpc('replace_occupant', {
    p_unit: args.unitId,
    p_full_name: args.fullName.trim(),
    p_phone: args.phone.trim(),
    p_household_size: args.householdSize,
    p_opening_debt: args.openingDebt,
    p_opening_paid: args.openingPaid,
  });
  if (error) fail(error, 'Imeshindikana kubadilisha mkazi.');
}

export async function applyOpeningBalance(occupantId: string, debt: number, paid: number) {
  const { error } = await supabase.rpc('apply_opening_balance', {
    p_occupant: occupantId,
    p_debt: debt,
    p_paid: paid,
  });
  if (error) fail(error, 'Imeshindikana kuweka deni la awali.');
}

/* ============================ WAFANYAKAZI WA KAMPUNI ========================= */

export interface StaffRow {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: 'driver' | 'collector' | string;
  is_active: boolean;
  employee_id: string | null;
  license_number: string | null;
  created_at: string;
}

export async function listCompanyStaff(companyId: string): Promise<StaffRow[]> {
  const { data, error } = await supabase.rpc('list_company_staff', { p_company: companyId });
  if (error) fail(error, 'Imeshindikana kupakia wafanyakazi.');
  return (data ?? []) as StaffRow[];
}

export async function setStaffActive(userId: string, active: boolean) {
  const { error } = await supabase.rpc('set_staff_active', { p_user: userId, p_active: active });
  if (error) fail(error, 'Imeshindikana kubadili hali ya mfanyakazi.');
}

export interface CreateStaffInput {
  company_id: string;
  role: 'driver' | 'collector';
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  license_number?: string;
  employee_id?: string;
  ward_ids?: string[];
}

/** Admin wa kampuni anamsajili dereva/mkusanyaji (Edge Function: create-company-staff). */
export async function createCompanyStaff(input: CreateStaffInput) {
  const { data, error } = await supabase.functions.invoke('create-company-staff', { body: input });
  if (error) {
    // Jaribu kusoma ujumbe halisi kutoka kwa function
    let msg = error.message;
    if (/failed to send a request|fetch/i.test(msg)) {
      throw new Error(
        "Function 'create-company-staff' haijapatikana. Hakikisha imewekwa (deploy) kwenye Supabase → Edge Functions, kisha jaribu tena."
      );
    }
    try {
      const ctx = (error as unknown as { context?: Response }).context;
      if (ctx) msg = (await ctx.json()).error || msg;
    } catch {
      /* acha ujumbe wa kawaida */
    }
    throw new Error(msg || 'Imeshindikana kumsajili mfanyakazi.');
  }
  if (data?.error) throw new Error(data.error);
  return data as { user_id: string };
}
