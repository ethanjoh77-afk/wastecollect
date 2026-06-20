-- RLS Policies for users table
CREATE POLICY "users_select_own" ON users FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Allow super admins to manage all users
CREATE POLICY "users_admin_all" ON users FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- RLS Policies for municipalities
CREATE POLICY "municipalities_select_all" ON municipalities FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "municipalities_admin" ON municipalities FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'municipality_admin'))
  );

-- RLS Policies for companies
CREATE POLICY "companies_select_all" ON companies FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "companies_admin" ON companies FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'company_admin'))
  );

-- RLS Policies for citizens
CREATE POLICY "citizens_select_own" ON citizens FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "citizens_insert_own" ON citizens FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "citizens_update_own" ON citizens FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for waste_reports
CREATE POLICY "reports_select_own" ON waste_reports FOR SELECT
  TO authenticated USING (auth.uid() = citizen_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'municipality_admin')));

CREATE POLICY "reports_insert_citizen" ON waste_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = citizen_id);

CREATE POLICY "reports_update_admin" ON waste_reports FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'municipality_admin'))
  );

-- RLS Policies for notifications
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for complaints
CREATE POLICY "complaints_select_own" ON complaints FOR SELECT
  TO authenticated USING (auth.uid() = citizen_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'municipality_admin')));

CREATE POLICY "complaints_insert_citizen" ON complaints FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = citizen_id);

CREATE POLICY "complaints_update_admin" ON complaints FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'municipality_admin'))
  );

-- RLS Policies for payments
CREATE POLICY "payments_select_own" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = citizen_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'municipality_admin')));

CREATE POLICY "payments_insert_own" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = citizen_id);

-- RLS Policies for invoices
CREATE POLICY "invoices_select_own" ON invoices FOR SELECT
  TO authenticated USING (auth.uid() = citizen_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'municipality_admin')));

CREATE POLICY "invoices_insert_admin" ON invoices FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'municipality_admin'))
  );

-- RLS Policies for routes (drivers see their own, admins see all)
CREATE POLICY "routes_select_own" ON routes FOR SELECT
  TO authenticated USING (
    auth.uid() = driver_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'municipality_admin', 'company_admin'))
  );

CREATE POLICY "routes_update_driver" ON routes FOR UPDATE
  TO authenticated USING (auth.uid() = driver_id);

-- RLS Policies for vehicles
CREATE POLICY "vehicles_select_company" ON vehicles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "vehicles_admin" ON vehicles FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'company_admin', 'municipality_admin'))
  );

-- RLS Policies for smart_bins
CREATE POLICY "smart_bins_select_all" ON smart_bins FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "smart_bins_admin" ON smart_bins FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'municipality_admin', 'company_admin'))
  );

-- RLS Policies for recycling_records
CREATE POLICY "recycling_select_own" ON recycling_records FOR SELECT
  TO authenticated USING (auth.uid() = citizen_id);

CREATE POLICY "recycling_insert_own" ON recycling_records FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = citizen_id);

-- Public read for waste categories
CREATE POLICY "waste_categories_select_all" ON waste_categories FOR SELECT
  TO authenticated USING (true);

-- Public read for collection schedules
CREATE POLICY "schedules_select_all" ON collection_schedules FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "schedules_admin" ON collection_schedules FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'municipality_admin'))
  );

-- RLS Policies for drivers
CREATE POLICY "drivers_select_own" ON drivers FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'company_admin', 'municipality_admin'))
  );

CREATE POLICY "drivers_admin" ON drivers FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'company_admin'))
  );

-- RLS for audit logs - only super admin
CREATE POLICY "audit_logs_admin" ON audit_logs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (true);
