-- =====================================================================
-- 006_collection_helpers.sql  (inategemea 005_household_billing)
--  * register_property : usajili wa nyumba + vichwa + wakazi kwa mara moja (atomic, idempotent)
--  * add_collector     : admin anamfanya mtumiaji aliyejisajili kuwa mkusanyaji (kwa email)
--  * collector_performance / list_shifts : ripoti za admin zenye majina ya wakusanyaji
--  * v_debtors         : orodha ya wadaiwa (pamoja na waliohama)
-- =====================================================================

ALTER TABLE properties ADD COLUMN IF NOT EXISTS client_uuid UUID UNIQUE;

-- ---------------------------------------------------------------------
-- Matokeo ya usajili: property + vitengo vyenye code
-- ---------------------------------------------------------------------
CREATE FUNCTION property_registration_result(p_property UUID) RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'property_id', p_property,
    'units', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', u.id, 'code', u.code, 'label', u.label, 'unit_type', u.unit_type,
               'status', u.status, 'occupant_name', o.full_name) ORDER BY u.created_at, u.code)
        FROM billing_units u
        LEFT JOIN occupants o ON o.billing_unit_id = u.id AND o.moved_out IS NULL
       WHERE u.property_id = p_property), '[]'::jsonb));
$$;

-- p_units: [{ "unit_type":"tenant", "label":"Chumba 1", "fee_plan_id":null,
--             "occupant": {"full_name":"Abdul","phone":"0712...","household_size":4} | null }]
CREATE FUNCTION register_property(
  p_client_uuid UUID, p_company UUID, p_ward UUID, p_street UUID, p_type TEXT,
  p_owner_name TEXT, p_owner_phone TEXT, p_total_rooms INT, p_address TEXT,
  p_lat NUMERIC, p_lng NUMERIC, p_units JSONB
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_prop UUID; v_u JSONB; v_unit UUID; v_occ JSONB;
  v_landlords INT := 0; v_count INT := 0;
BEGIN
  -- Retry ya offline: rudisha matokeo yale yale
  SELECT id INTO v_prop FROM properties WHERE client_uuid = p_client_uuid;
  IF FOUND THEN RETURN property_registration_result(v_prop); END IF;

  IF auth.uid() IS NULL OR NOT hh_can_see_ward(p_company, p_ward) THEN
    RAISE EXCEPTION 'not allowed to register property in this area';
  END IF;
  IF p_type NOT IN ('family','multi_tenant','commercial') THEN RAISE EXCEPTION 'invalid property type'; END IF;
  IF jsonb_typeof(p_units) <> 'array' OR jsonb_array_length(p_units) = 0 THEN
    RAISE EXCEPTION 'at least one billing unit is required';
  END IF;

  FOR v_u IN SELECT * FROM jsonb_array_elements(p_units) LOOP
    v_count := v_count + 1;
    IF p_type = 'family'       AND v_u->>'unit_type' <> 'family'   THEN RAISE EXCEPTION 'family house must have one family unit'; END IF;
    IF p_type = 'multi_tenant' AND v_u->>'unit_type' NOT IN ('tenant','landlord') THEN RAISE EXCEPTION 'multi_tenant house accepts tenant/landlord units'; END IF;
    IF p_type = 'commercial'   AND v_u->>'unit_type' <> 'business' THEN RAISE EXCEPTION 'commercial property accepts business units'; END IF;
    IF v_u->>'unit_type' = 'landlord' THEN v_landlords := v_landlords + 1; END IF;
  END LOOP;
  IF p_type = 'family' AND v_count <> 1 THEN RAISE EXCEPTION 'family house must have exactly one unit'; END IF;
  IF v_landlords > 1 THEN RAISE EXCEPTION 'only one landlord unit per property'; END IF;

  INSERT INTO properties (client_uuid, company_id, ward_id, street_id, property_type, owner_name, owner_phone,
                          total_rooms, address, location_lat, location_lng, created_by)
  VALUES (p_client_uuid, p_company, p_ward, p_street, p_type, NULLIF(trim(p_owner_name), ''), NULLIF(trim(p_owner_phone), ''),
          p_total_rooms, NULLIF(trim(p_address), ''), p_lat, p_lng, auth.uid())
  RETURNING id INTO v_prop;

  FOR v_u IN SELECT * FROM jsonb_array_elements(p_units) LOOP
    INSERT INTO billing_units (property_id, unit_type, label, fee_plan_id)
    VALUES (v_prop, v_u->>'unit_type', NULLIF(trim(v_u->>'label'), ''), NULLIF(v_u->>'fee_plan_id', '')::UUID)
    RETURNING id INTO v_unit;

    v_occ := v_u->'occupant';
    IF v_occ IS NOT NULL AND jsonb_typeof(v_occ) = 'object' AND COALESCE(trim(v_occ->>'full_name'), '') <> '' THEN
      INSERT INTO occupants (billing_unit_id, full_name, phone, household_size, moved_in)
      VALUES (v_unit, trim(v_occ->>'full_name'), NULLIF(trim(v_occ->>'phone'), ''),
              NULLIF(v_occ->>'household_size', '')::INT,
              COALESCE(NULLIF(v_occ->>'moved_in', '')::DATE, CURRENT_DATE));
    END IF;
  END LOOP;

  INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (auth.uid(), 'property_registered', 'properties', v_prop,
          jsonb_build_object('type', p_type, 'units', v_count));

  RETURN property_registration_result(v_prop);
END $$;

-- ---------------------------------------------------------------------
-- Admin: mfanye mtumiaji (aliyejisajili kawaida) kuwa mkusanyaji
-- ---------------------------------------------------------------------
CREATE FUNCTION add_collector(p_company UUID, p_email TEXT, p_ward_ids UUID[] DEFAULT '{}')
RETURNS collectors
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user users; v_col collectors; v_ward UUID;
BEGIN
  IF NOT hh_is_admin(p_company) THEN RAISE EXCEPTION 'only an admin can add collectors'; END IF;
  SELECT * INTO v_user FROM users WHERE lower(email) = lower(trim(p_email));
  IF NOT FOUND THEN RAISE EXCEPTION 'user with this email is not registered yet'; END IF;
  IF v_user.role NOT IN ('citizen','collector') THEN
    RAISE EXCEPTION 'user already has role %', v_user.role;
  END IF;
  SELECT * INTO v_col FROM collectors WHERE user_id = v_user.id;
  IF FOUND AND v_col.company_id <> p_company THEN
    RAISE EXCEPTION 'user is a collector for another company';
  END IF;

  UPDATE users SET role = 'collector' WHERE id = v_user.id;
  INSERT INTO collectors (user_id, company_id, is_active) VALUES (v_user.id, p_company, true)
  ON CONFLICT (user_id) DO UPDATE SET is_active = true
  RETURNING * INTO v_col;

  DELETE FROM collector_wards WHERE collector_id = v_user.id;
  FOREACH v_ward IN ARRAY COALESCE(p_ward_ids, '{}') LOOP
    INSERT INTO collector_wards (collector_id, ward_id) VALUES (v_user.id, v_ward);
  END LOOP;

  INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (auth.uid(), 'collector_added', 'collectors', v_user.id, jsonb_build_object('email', v_user.email));
  RETURN v_col;
END $$;

-- ---------------------------------------------------------------------
-- Ripoti za admin (zenye majina ya wakusanyaji)
-- ---------------------------------------------------------------------
CREATE FUNCTION collector_performance(p_company UUID)
RETURNS TABLE (user_id UUID, full_name TEXT, email TEXT, phone TEXT, is_active BOOLEAN,
               ward_ids UUID[], collected_this_month NUMERIC, payments_this_month BIGINT,
               cash_today NUMERIC, properties_registered BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT hh_is_admin(p_company) THEN RAISE EXCEPTION 'only an admin can view this'; END IF;
  RETURN QUERY
  SELECT c.user_id,
         COALESCE(NULLIF(trim(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), ''), u.email)::TEXT,
         u.email::TEXT, u.phone::TEXT, c.is_active,
         COALESCE((SELECT array_agg(cw.ward_id) FROM collector_wards cw WHERE cw.collector_id = c.user_id), '{}'::UUID[]),
         COALESCE((SELECT SUM(up.amount) FROM unit_payments up
                    WHERE up.collected_by = c.user_id AND up.status = 'completed'
                      AND up.created_at >= date_trunc('month', NOW())), 0),
         (SELECT COUNT(*) FROM unit_payments up
           WHERE up.collected_by = c.user_id AND up.status = 'completed'
             AND up.created_at >= date_trunc('month', NOW())),
         COALESCE((SELECT SUM(up.amount) FROM unit_payments up
                    WHERE up.collected_by = c.user_id AND up.status = 'completed' AND up.method = 'cash'
                      AND (up.created_at AT TIME ZONE 'Africa/Dar_es_Salaam')::DATE =
                          (NOW() AT TIME ZONE 'Africa/Dar_es_Salaam')::DATE), 0),
         (SELECT COUNT(*) FROM properties pr WHERE pr.created_by = c.user_id)
    FROM collectors c JOIN users u ON u.id = c.user_id
   WHERE c.company_id = p_company
   ORDER BY 6 DESC NULLS LAST;
END $$;

CREATE FUNCTION list_shifts(p_company UUID, p_days INT DEFAULT 14)
RETURNS TABLE (id UUID, collector_id UUID, collector_name TEXT, shift_date DATE, expected_cash NUMERIC,
               declared_cash NUMERIC, status TEXT, notes TEXT, submitted_at TIMESTAMPTZ, confirmed_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT hh_is_admin(p_company) THEN RAISE EXCEPTION 'only an admin can view this'; END IF;
  RETURN QUERY
  SELECT s.id, s.collector_id,
         COALESCE(NULLIF(trim(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), ''), u.email)::TEXT,
         s.shift_date, s.expected_cash, s.declared_cash, s.status::TEXT, s.notes, s.submitted_at, s.confirmed_at
    FROM collector_shifts s JOIN users u ON u.id = s.collector_id
   WHERE s.company_id = p_company AND s.shift_date >= CURRENT_DATE - GREATEST(p_days, 1)
   ORDER BY s.shift_date DESC, s.submitted_at DESC NULLS LAST;
END $$;

-- ---------------------------------------------------------------------
-- Wadaiwa (pamoja na waliohama)
-- ---------------------------------------------------------------------
CREATE VIEW v_debtors WITH (security_invoker = true) AS
SELECT b.occupant_id, b.company_id, b.billing_unit_id, b.full_name, b.phone, b.is_current, b.moved_out,
       b.billed, b.paid, b.balance,
       u.code, u.label, u.unit_type, p.id AS property_id, p.ward_id, w.name AS ward_name,
       p.address, p.owner_name, p.location_lat, p.location_lng
  FROM v_occupant_balances b
  JOIN billing_units u ON u.id = b.billing_unit_id
  JOIN properties p    ON p.id = u.property_id
  LEFT JOIN wards w    ON w.id = p.ward_id
 WHERE b.balance > 0;

-- ---------------------------------------------------------------------
-- Ruhusa
-- ---------------------------------------------------------------------
REVOKE ALL ON FUNCTION property_registration_result(UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION property_registration_result(UUID) TO service_role;

REVOKE ALL ON FUNCTION register_property(UUID, UUID, UUID, UUID, TEXT, TEXT, TEXT, INT, TEXT, NUMERIC, NUMERIC, JSONB) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION register_property(UUID, UUID, UUID, UUID, TEXT, TEXT, TEXT, INT, TEXT, NUMERIC, NUMERIC, JSONB) TO authenticated;

REVOKE ALL ON FUNCTION add_collector(UUID, TEXT, UUID[])    FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION collector_performance(UUID)          FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION list_shifts(UUID, INT)               FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION add_collector(UUID, TEXT, UUID[]) TO authenticated;
GRANT  EXECUTE ON FUNCTION collector_performance(UUID)       TO authenticated;
GRANT  EXECUTE ON FUNCTION list_shifts(UUID, INT)            TO authenticated;

-- ---------------------------------------------------------------------
-- Wakusanyaji wanahitaji kusoma orodha ya kata (wards) na mitaa (streets).
-- Policy inaongezwa tu kama hakuna policy ya SELECT iliyopo tayari.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wards'
                  AND cmd IN ('SELECT', 'ALL')) THEN
    EXECUTE 'CREATE POLICY wards_read_authenticated ON wards FOR SELECT TO authenticated USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'streets'
                  AND cmd IN ('SELECT', 'ALL')) THEN
    EXECUTE 'CREATE POLICY streets_read_authenticated ON streets FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;
