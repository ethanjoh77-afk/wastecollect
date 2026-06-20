export type UserRole = 'super_admin' | 'municipality_admin' | 'company_admin' | 'driver' | 'citizen';

export type VehicleStatus = 'available' | 'on_route' | 'maintenance' | 'inactive';

export type RouteStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type StopStatus = 'pending' | 'completed' | 'skipped';

export type ReportStatus = 'pending' | 'in_review' | 'resolved' | 'rejected';

export type ReportType = 'illegal_dumping' | 'overflowing_bin' | 'missed_collection' | 'dirty_site' | 'other';

export type PaymentMethod = 'mpesa' | 'airtel_money' | 'tigo_pesa' | 'halopesa' | 'card' | 'bank_transfer';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type PaymentType = 'subscription' | 'special_pickup' | 'fine' | 'other';

export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationType = 'push' | 'sms' | 'email';

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Municipality {
  id: string;
  name: string;
  code?: string;
  country?: string;
  region?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  admin_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  registration_number: string;
  municipality_id: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo_url?: string;
  admin_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ward {
  id: string;
  municipality_id: string;
  name: string;
  code?: string;
  population?: number;
  area_sqkm?: number;
  is_active: boolean;
  created_at: string;
}

export interface Street {
  id: string;
  ward_id: string;
  name: string;
  start_point?: string;
  end_point?: string;
  length_km?: number;
  is_active: boolean;
  created_at: string;
}

export interface CollectionZone {
  id: string;
  municipality_id: string;
  name: string;
  code?: string;
  ward_id?: string;
  boundary_geojson?: object;
  collection_day?: string;
  frequency?: string;
  is_active: boolean;
  created_at: string;
}

export interface WasteCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  color?: string;
  disposal_instructions?: string;
  is_recyclable: boolean;
  is_hazardous: boolean;
  created_at: string;
}

export interface Vehicle {
  id: string;
  company_id: string;
  registration_number: string;
  vehicle_type?: string;
  capacity_kg?: number;
  fuel_type?: string;
  current_latitude?: number;
  current_longitude?: number;
  last_location_update?: string;
  status: VehicleStatus;
  driver_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SmartBin {
  id: string;
  zone_id?: string;
  street_id?: string;
  bin_code: string;
  location_lat?: number;
  location_lng?: number;
  capacity_liters?: number;
  fill_level: number;
  battery_level: number;
  temperature?: number;
  last_emptied_at?: string;
  has_fire_alert: boolean;
  has_overflow_alert: boolean;
  waste_category_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  user_id: string;
  company_id?: string;
  employee_id?: string;
  license_number?: string;
  license_expiry?: string;
  assigned_vehicle_id?: string;
  is_available: boolean;
  rating?: number;
  total_collections: number;
  created_at: string;
  updated_at: string;
}

export interface Citizen {
  user_id: string;
  municipality_id?: string;
  citizen_id?: string;
  address?: string;
  ward_id?: string;
  street_id?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  eco_score: number;
  reward_points: number;
  property_code?: string;
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  company_id?: string;
  driver_id?: string;
  vehicle_id?: string;
  name?: string;
  zone_ids?: string[];
  total_stops?: number;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  status: RouteStatus;
  scheduled_date: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RouteStop {
  id: string;
  route_id: string;
  sequence_number: number;
  location_lat?: number;
  location_lng?: number;
  address?: string;
  bin_id?: string;
  status: StopStatus;
  completed_at?: string;
  skip_reason?: string;
  proof_photo_url?: string;
  created_at: string;
}

export interface CollectionSchedule {
  id: string;
  zone_id: string;
  collection_day: string;
  start_time?: string;
  end_time?: string;
  waste_category_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface WasteReport {
  id: string;
  citizen_id: string;
  report_type: ReportType;
  description?: string;
  location_lat?: number;
  location_lng?: number;
  address?: string;
  photos: string[];
  status: ReportStatus;
  priority_score: number;
  assigned_to?: string;
  municipality_id?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  citizen_id: string;
  municipality_id?: string;
  amount: number;
  currency: string;
  payment_method?: PaymentMethod;
  transaction_ref?: string;
  status: PaymentStatus;
  payment_type?: PaymentType;
  receipt_number?: string;
  invoice_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  citizen_id: string;
  municipality_id?: string;
  invoice_number: string;
  amount: number;
  description?: string;
  due_date?: string;
  status: 'unpaid' | 'paid' | 'overdue' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: string;
  citizen_id: string;
  complaint_type: string;
  subject?: string;
  description?: string;
  status: ComplaintStatus;
  priority: Priority;
  assigned_to?: string;
  municipality_id?: string;
  attachments: string[];
  resolution?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  comment: string;
  attachments: string[];
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  data?: object;
  is_read: boolean;
  sent_via?: NotificationType;
  created_at: string;
}

export interface RecyclingRecord {
  id: string;
  citizen_id: string;
  waste_category_id?: string;
  quantity_kg?: number;
  points_earned?: number;
  recycling_center_id?: string;
  verified_by?: string;
  created_at: string;
}

export interface RecyclingCenter {
  id: string;
  name: string;
  address?: string;
  location_lat?: number;
  location_lng?: number;
  accepted_categories?: string[];
  contact_phone?: string;
  contact_email?: string;
  operating_hours?: object;
  municipality_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: object;
  new_values?: object;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface DashboardStats {
  totalCitizens: number;
  activeDrivers: number;
  vehiclesOnline: number;
  wasteCollected: number;
  revenue: number;
  pendingReports: number;
  collectionEfficiency: number;
  recyclingRate: number;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}
