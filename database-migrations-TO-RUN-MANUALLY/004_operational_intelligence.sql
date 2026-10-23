/*
# Operational Intelligence — dispatch linking, fuel/cost tracking, vehicle alerts

Inaziba mapengo yaliyobainika dhidi ya maswali ya market validation
(WasteCollect – Market & Product Validation Questions, Swali #5, #6, #7, #8-10):

1. Dispatch linking (Swali #5)
   - `waste_reports` inapata `route_id`, `vehicle_id`, `dispatched_at` ili report
     ya "missed_collection" iweze kuunganishwa moja kwa moja na route/gari
     lililopangiwa, badala ya kubaki "assigned_to mtu" pekee.

2. Fuel & cost tracking (Swali #6, #8)
   - Jedwali jipya `fuel_logs` — kila mara dereva/company_admin anapojaza mafuta,
     anarekodi lita, gharama (TSh), na odometer. Hii ndiyo msingi wa kupima
     cost-per-route na cost-per-pickup — kigezo ambacho hakikuwepo kabisa
     kwenye schema ya awali.

3. Vehicle operational alerts (Swali #7 — GPS as decision-support, not just a map)
   - Jedwali jipya `vehicle_alerts` linalorekodi matukio kama gari kutopeleka
     location update kwa muda mrefu likiwa "on_route" (stale_location) au
     kusimama muda mrefu bila kutimiza stop (off_route_stopped). Hii inampa
     manager kitu cha ku-act nacho, si ramani tu.

4. View `route_cost_summary` — muhtasari wa gharama kwa kila route, unaotumika
   moja kwa moja na KPI dashboard mpya.

SALAMA: Migration hii ni additive tu — HAIBADILISHI wala kufuta jedwali/column
yoyote iliyopo. Endesha kwenye Supabase Dashboard → SQL Editor.
*/

-- 1. Dispatch linking on waste_reports -----------------------------------
ALTER TABLE waste_reports ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES routes(id);
ALTER TABLE waste_reports ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id);
ALTER TABLE waste_reports ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_waste_reports_route ON waste_reports(route_id);
CREATE INDEX IF NOT EXISTS idx_waste_reports_vehicle ON waste_reports(vehicle_id);

-- 2. Fuel logs (cost tracking) --------------------------------------------
CREATE TABLE IF NOT EXISTS fuel_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  route_id UUID REFERENCES routes(id),
  liters DECIMAL(8,2) NOT NULL CHECK (liters > 0),
  cost_amount DECIMAL(12,2) NOT NULL CHECK (cost_amount >= 0),
  odometer_km DECIMAL(10,2),
  logged_by UUID REFERENCES users(id),
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fuel_logs_company ON fuel_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_route ON fuel_logs(route_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle ON fuel_logs(vehicle_id);

ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fuel_logs_super_admin_all" ON fuel_logs FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "fuel_logs_company_select" ON fuel_logs FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = fuel_logs.company_id AND companies.admin_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.user_id = auth.uid() AND drivers.company_id = fuel_logs.company_id
    )
  );

CREATE POLICY "fuel_logs_company_insert" ON fuel_logs FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = fuel_logs.company_id AND companies.admin_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.user_id = auth.uid() AND drivers.company_id = fuel_logs.company_id
    )
  );

-- 3. Vehicle operational alerts (GPS decision-support) ---------------------
CREATE TABLE IF NOT EXISTS vehicle_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  route_id UUID REFERENCES routes(id),
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('stale_location', 'off_route_stopped', 'missed_stop_delay')),
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_alerts_company ON vehicle_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_alerts_unresolved ON vehicle_alerts(company_id, is_resolved);

ALTER TABLE vehicle_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicle_alerts_super_admin_all" ON vehicle_alerts FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "vehicle_alerts_company_select" ON vehicle_alerts FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = vehicle_alerts.company_id AND companies.admin_id = auth.uid()
    )
  );

CREATE POLICY "vehicle_alerts_company_update" ON vehicle_alerts FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = vehicle_alerts.company_id AND companies.admin_id = auth.uid()
    )
  );

CREATE POLICY "vehicle_alerts_system_insert" ON vehicle_alerts FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = vehicle_alerts.company_id AND companies.admin_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- 4. Route cost summary view (Swali #6, #8 — ROI unaopimika) ---------------
CREATE OR REPLACE VIEW route_cost_summary AS
SELECT
  r.id AS route_id,
  r.company_id,
  r.name AS route_name,
  r.scheduled_date,
  r.total_stops,
  r.status,
  COALESCE(SUM(fl.cost_amount), 0) AS total_fuel_cost,
  COALESCE(SUM(fl.liters), 0) AS total_liters,
  (SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.id AND rs.status = 'completed') AS completed_stops,
  (SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.id AND rs.status = 'skipped') AS skipped_stops,
  CASE
    WHEN (SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.id AND rs.status = 'completed') > 0
    THEN ROUND(
      COALESCE(SUM(fl.cost_amount), 0) /
      (SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.id AND rs.status = 'completed'),
      2
    )
    ELSE NULL
  END AS cost_per_completed_pickup
FROM routes r
LEFT JOIN fuel_logs fl ON fl.route_id = r.id
GROUP BY r.id, r.company_id, r.name, r.scheduled_date, r.total_stops, r.status;
