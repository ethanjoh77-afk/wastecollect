// Aina za mfumo wa ukusanyaji wa ada kwa kaya/vichwa (household billing).

export type UnitType = 'family' | 'tenant' | 'landlord' | 'business';
export type PropertyType = 'family' | 'multi_tenant' | 'commercial';
export type PayStatus = 'paid' | 'partial' | 'unpaid' | 'vacant';
export type MapStatus = PayStatus;
export type PayMethod = 'cash' | 'mpesa' | 'airtel_money' | 'tigo_pesa' | 'halopesa' | 'bank_transfer';

export const UNIT_TYPE_LABEL: Record<UnitType, string> = {
  family: 'Familia',
  tenant: 'Mpangaji',
  landlord: 'Mwenye nyumba',
  business: 'Biashara',
};

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  family: 'Nyumba ya familia',
  multi_tenant: 'Nyumba ya wapangaji',
  commercial: 'Biashara / duka',
};

export const PAY_STATUS_LABEL: Record<PayStatus, string> = {
  paid: 'Amelipa',
  partial: 'Amelipa sehemu',
  unpaid: 'Hajalipa',
  vacant: 'Wazi',
};

export const PAY_METHOD_LABEL: Record<PayMethod, string> = {
  cash: 'Pesa taslimu',
  mpesa: 'M-Pesa',
  airtel_money: 'Airtel Money',
  tigo_pesa: 'Mixx by Yas (Tigo Pesa)',
  halopesa: 'HaloPesa',
  bank_transfer: 'Benki',
};

export interface UnitStatusRow {
  billing_unit_id: string;
  company_id: string;
  property_id: string;
  code: string;
  unit_type: UnitType;
  label: string | null;
  status: 'active' | 'vacant' | 'inactive';
  ward_id: string | null;
  location_lat: number | null;
  location_lng: number | null;
  address: string | null;
  occupant_id: string | null;
  full_name: string | null;
  phone: string | null;
  balance: number | null;
  pay_status: PayStatus;
}

export interface PropertyMapRow {
  property_id: string;
  company_id: string;
  ward_id: string | null;
  property_type: PropertyType;
  owner_name: string | null;
  address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  units_occupied: number;
  units_paid: number;
  units_partial: number;
  units_unpaid: number;
  total_debt: number;
  map_status: MapStatus;
}

export interface UnitPayment {
  id: string;
  occupant_id: string;
  billing_unit_id: string;
  amount: number;
  method: PayMethod;
  receipt_no: string;
  status: 'completed' | 'reversed';
  transaction_ref: string | null;
  collected_by: string | null;
  created_at: string;
  reversal_reason: string | null;
}

export interface OccupantBalance {
  occupant_id: string;
  billing_unit_id: string;
  full_name: string;
  phone: string | null;
  moved_in: string;
  moved_out: string | null;
  is_current: boolean;
  billed: number;
  paid: number;
  balance: number;
}

export interface AreaSummaryRow {
  company_id: string;
  ward_id: string | null;
  ward_name: string | null;
  active_units: number;
  billed_this_month: number;
  collected_this_month: number;
  outstanding_total: number;
}

export interface DebtorRow {
  occupant_id: string;
  company_id: string;
  billing_unit_id: string;
  full_name: string;
  phone: string | null;
  is_current: boolean;
  moved_out: string | null;
  billed: number;
  paid: number;
  balance: number;
  code: string;
  label: string | null;
  unit_type: UnitType;
  property_id: string;
  ward_id: string | null;
  ward_name: string | null;
  address: string | null;
  owner_name: string | null;
}

export interface FeePlan {
  id: string;
  company_id: string;
  name: string;
  unit_type: UnitType;
  amount: number;
  currency: string;
  is_active: boolean;
}

export interface CollectorRow {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  ward_ids: string[];
  collected_this_month: number;
  payments_this_month: number;
  cash_today: number;
  properties_registered: number;
}

export interface ShiftRow {
  id: string;
  collector_id: string;
  collector_name?: string;
  shift_date: string;
  expected_cash: number;
  declared_cash: number | null;
  status: 'open' | 'submitted' | 'discrepancy' | 'confirmed';
  notes: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
}

export interface Ward {
  id: string;
  name: string;
}

export interface Street {
  id: string;
  ward_id: string | null;
  name: string;
}

export interface RegisterUnitInput {
  unit_type: UnitType;
  label?: string;
  fee_plan_id?: string | null;
  occupant?: {
    full_name: string;
    phone?: string;
    household_size?: number | null;
  } | null;
}

export interface RegisterPropertyInput {
  client_uuid: string;
  company_id: string;
  ward_id: string;
  street_id: string | null;
  property_type: PropertyType;
  owner_name: string;
  owner_phone: string;
  total_rooms: number | null;
  address: string;
  lat: number | null;
  lng: number | null;
  units: RegisterUnitInput[];
}

export interface RegisteredUnit {
  id: string;
  code: string;
  label: string | null;
  unit_type: UnitType;
  status: string;
  occupant_name: string | null;
}

export interface RegisterPropertyResult {
  property_id: string;
  units: RegisteredUnit[];
}

export interface PaymentReceipt {
  receipt_no: string;
  amount: number;
  method: PayMethod;
  created_at: string;
  code: string;
  payer_name: string;
  balance_after: number | null;
  queued?: boolean;
}
