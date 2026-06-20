-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (base for all user types)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'municipality_admin', 'company_admin', 'driver', 'citizen')),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Municipalities
CREATE TABLE municipalities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE,
  country VARCHAR(100),
  region VARCHAR(100),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  logo_url TEXT,
  admin_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies (waste collection companies)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  registration_number VARCHAR(100) UNIQUE,
  municipality_id UUID REFERENCES municipalities(id),
  contact_person VARCHAR(200),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  logo_url TEXT,
  admin_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wards
CREATE TABLE wards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  municipality_id UUID REFERENCES municipalities(id),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50),
  population INTEGER,
  area_sqkm DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streets
CREATE TABLE streets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ward_id UUID REFERENCES wards(id),
  name VARCHAR(200) NOT NULL,
  start_point TEXT,
  end_point TEXT,
  length_km DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection Zones
CREATE TABLE collection_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  municipality_id UUID REFERENCES municipalities(id),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50),
  ward_id UUID REFERENCES wards(id),
  boundary_geojson JSONB,
  collection_day VARCHAR(20),
  frequency VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waste Categories
CREATE TABLE waste_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  disposal_instructions TEXT,
  is_recyclable BOOLEAN DEFAULT false,
  is_hazardous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_type VARCHAR(100),
  capacity_kg DECIMAL(10,2),
  fuel_type VARCHAR(50),
  current_latitude DECIMAL(10,8),
  current_longitude DECIMAL(11,8),
  last_location_update TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'on_route', 'maintenance', 'inactive')),
  driver_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Smart Bins
CREATE TABLE smart_bins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID REFERENCES collection_zones(id),
  street_id UUID REFERENCES streets(id),
  bin_code VARCHAR(100) UNIQUE,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  capacity_liters INTEGER,
  fill_level INTEGER DEFAULT 0,
  battery_level INTEGER DEFAULT 100,
  temperature DECIMAL(5,2),
  last_emptied_at TIMESTAMPTZ,
  has_fire_alert BOOLEAN DEFAULT false,
  has_overflow_alert BOOLEAN DEFAULT false,
  waste_category_id UUID REFERENCES waste_categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers
CREATE TABLE drivers (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  employee_id VARCHAR(100),
  license_number VARCHAR(100),
  license_expiry DATE,
  assigned_vehicle_id UUID REFERENCES vehicles(id),
  is_available BOOLEAN DEFAULT true,
  rating DECIMAL(3,2) DEFAULT 5.00,
  total_collections INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Citizens
CREATE TABLE citizens (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  municipality_id UUID REFERENCES municipalities(id),
  citizen_id VARCHAR(100) UNIQUE,
  address TEXT,
  ward_id UUID REFERENCES wards(id),
  street_id UUID REFERENCES streets(id),
  gps_latitude DECIMAL(10,8),
  gps_longitude DECIMAL(11,8),
  eco_score INTEGER DEFAULT 0,
  reward_points INTEGER DEFAULT 0,
  property_code VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection Routes
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  driver_id UUID REFERENCES users(id),
  vehicle_id UUID REFERENCES vehicles(id),
  name VARCHAR(200),
  zone_ids UUID[],
  total_stops INTEGER,
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  scheduled_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Route Stops
CREATE TABLE route_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id),
  sequence_number INTEGER,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  address TEXT,
  bin_id UUID REFERENCES smart_bins(id),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  skip_reason TEXT,
  proof_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection Schedules
CREATE TABLE collection_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID REFERENCES collection_zones(id),
  collection_day VARCHAR(20) NOT NULL,
  start_time TIME,
  end_time TIME,
  waste_category_id UUID REFERENCES waste_categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waste Reports (from citizens)
CREATE TABLE waste_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  citizen_id UUID REFERENCES users(id),
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('illegal_dumping', 'overflowing_bin', 'missed_collection', 'dirty_site', 'other')),
  description TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  address TEXT,
  photos JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'rejected')),
  priority_score INTEGER DEFAULT 0,
  assigned_to UUID REFERENCES users(id),
  municipality_id UUID REFERENCES municipalities(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  citizen_id UUID REFERENCES users(id),
  municipality_id UUID REFERENCES municipalities(id),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'TZS',
  payment_method VARCHAR(50) CHECK (payment_method IN ('mpesa', 'airtel_money', 'tigo_pesa', 'halopesa', 'card', 'bank_transfer')),
  transaction_ref VARCHAR(200),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_type VARCHAR(50) CHECK (payment_type IN ('subscription', 'special_pickup', 'fine', 'other')),
  receipt_number VARCHAR(100),
  invoice_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  citizen_id UUID REFERENCES users(id),
  municipality_id UUID REFERENCES municipalities(id),
  invoice_number VARCHAR(100) UNIQUE,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complaints/Tickets
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  citizen_id UUID REFERENCES users(id),
  complaint_type VARCHAR(100) NOT NULL,
  subject VARCHAR(200),
  description TEXT,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES users(id),
  municipality_id UUID REFERENCES municipalities(id),
  attachments JSONB DEFAULT '[]',
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket Comments
CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES complaints(id),
  user_id UUID REFERENCES users(id),
  comment TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  sent_via VARCHAR(50) CHECK (sent_via IN ('push', 'sms', 'email')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recycling Records
CREATE TABLE recycling_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  citizen_id UUID REFERENCES users(id),
  waste_category_id UUID REFERENCES waste_categories(id),
  quantity_kg DECIMAL(10,2),
  points_earned INTEGER,
  recycling_center_id UUID,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recycling Centers
CREATE TABLE recycling_centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  address TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  accepted_categories UUID[],
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  operating_hours JSONB,
  municipality_id UUID REFERENCES municipalities(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTP codes for authentication
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  code VARCHAR(10) NOT NULL,
  type VARCHAR(50) DEFAULT 'login' CHECK (type IN ('login', 'verification', 'password_reset')),
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycling_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycling_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Insert default waste categories
INSERT INTO waste_categories (name, code, icon, color, is_recyclable, is_hazardous) VALUES
('Household Waste', 'HH', 'trash-2', '#6B7280', false, false),
('Plastic', 'PL', 'package', '#3B82F6', true, false),
('Glass', 'GL', 'wine', '#10B981', true, false),
('Metal', 'MT', 'cog', '#F59E0B', true, false),
('Organic', 'OR', 'leaf', '#22C55E', false, false),
('Electronic Waste', 'EW', 'monitor', '#8B5CF6', false, true),
('Medical Waste', 'MW', 'cross', '#EF4444', false, true),
('Construction Waste', 'CW', 'building', '#78716C', false, false),
('Hazardous Waste', 'HZ', 'alert-triangle', '#DC2626', false, true),
('Recyclables', 'RC', 'recycle', '#06B6D4', true, false);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_vehicles_company ON vehicles(company_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_smart_bins_zone ON smart_bins(zone_id);
CREATE INDEX idx_routes_driver ON routes(driver_id);
CREATE INDEX idx_routes_date ON routes(scheduled_date);
CREATE INDEX idx_waste_reports_status ON waste_reports(status);
CREATE INDEX idx_payments_citizen ON payments(citizen_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
