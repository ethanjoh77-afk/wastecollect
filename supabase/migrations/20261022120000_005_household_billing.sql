-- =====================================================================
-- 005_household_billing.sql
-- Ukusanyaji wa ada kwa "kichwa" (billing unit):
--   * family   : nyumba ya familia = 1 unit (mwenye nyumba/mkuu wa familia analipa)
--   * tenant   : kila mpangaji = 1 unit (code yake mwenyewe)
--   * landlord : vyumba vya mwenye nyumba = 1 unit tu (kama anaishi/anatumia)
--   * business : duka/biashara, ada yake tofauti (fee_plans)
-- Vyumba vitupu (vacant) havizalishi deni. Deni linamfuata mtu (occupant).
-- Ledger ni append-only: malipo/madeni hayafutwi, yanarekebishwa kwa reversal.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Role mpya: collector
-- ---------------------------------------------------------------------
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  role IN ('super_admin','municipality_admin','company_admin','driver','citizen','collector')
);

-- ---------------------------------------------------------------------
-- 1. Wakusanyaji na maeneo yao
-- ---------------------------------------------------------------------
CREATE TABLE collectors (
  user_id    UUID PRIMARY KEY REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kama mkusanyaji hana ward yoyote hapa, anaona kampuni nzima.
CREATE TABLE collector_wards (
  collector_id UUID NOT NULL REFERENCES collectors(user_id) ON DELETE CASCADE,
  ward_id      UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  PRIMARY KEY (collector_id, ward_id)
);

-- ---------------------------------------------------------------------
-- 2. Ada (fee plans)
-- ---------------------------------------------------------------------
CREATE TABLE fee_plans (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name       VARCHAR(100) NOT NULL,
  unit_type  VARCHAR(20) NOT NULL CHECK (unit_type IN ('family','tenant','landlord','business')),
  amount     NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency   VARCHAR(10) NOT NULL DEFAULT 'TZS',
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, name)
);

-- ---------------------------------------------------------------------
-- 3. Nyumba / jengo
-- ---------------------------------------------------------------------
CREATE TABLE properties (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id),
  ward_id       UUID REFERENCES wards(id),
  street_id     UUID REFERENCES streets(id),
  property_type VARCHAR(20) NOT NULL CHECK (property_type IN ('family','multi_tenant','commercial')),
  owner_name    VARCHAR(200),
  owner_phone   VARCHAR(20),
  total_rooms   INTEGER CHECK (total_rooms >= 0),  -- taarifa tu, haiathiri ada
  address       TEXT,
  location_lat  DECIMAL(10,8),
  location_lng  DECIMAL(11,8),
  notes         TEXT,
  created_by    UUID REFERENCES users(id) DEFAULT auth.uid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 4. Billing units (kichwa kimoja = code moja)
-- ---------------------------------------------------------------------
CREATE SEQUENCE billing_unit_code_seq;

CREATE TABLE billing_units (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES companies(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  code        VARCHAR(20) NOT NULL UNIQUE,
  unit_type   VARCHAR(20) NOT NULL CHECK (unit_type IN ('family','tenant','landlord','business')),
  label       VARCHAR(100),                       -- mf. "Chumba 3", "Duka la mama Neema"
  status      VARCHAR(20) NOT NULL DEFAULT 'vacant' CHECK (status IN ('active','vacant','inactive')),
  fee_plan_id UUID REFERENCES fee_plans(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Nyumba moja: unit moja tu ya family, na kichwa kimoja tu cha landlord
CREATE UNIQUE INDEX one_family_unit_per_property   ON billing_units(property_id) WHERE unit_type = 'family';
CREATE UNIQUE INDEX one_landlord_unit_per_property ON billing_units(property_id) WHERE unit_type = 'landlord';

-- ---------------------------------------------------------------------
-- 5. Occupants (mtu anayelipa; deni linamfuata yeye)
-- ---------------------------------------------------------------------
CREATE TABLE occupants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id),
  billing_unit_id UUID NOT NULL REFERENCES billing_units(id),
  full_name       VARCHAR(200) NOT NULL,
  phone           VARCHAR(20),
  household_size  INTEGER CHECK (household_size > 0),  -- taarifa tu
  moved_in        DATE NOT NULL DEFAULT CURRENT_DATE,
  moved_out       DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (moved_out IS NULL OR moved_out >= moved_in)
);
-- Unit moja = mkazi mmoja wa sasa tu
CREATE UNIQUE INDEX one_current_occupant ON occupants(billing_unit_id) WHERE moved_out IS NULL;

-- ---------------------------------------------------------------------
-- 6. Malipo (jedwali jipya; la zamani `payments` linabaki kwa citizens)
-- ---------------------------------------------------------------------
CREATE SEQUENCE receipt_seq;

CREATE TABLE unit_payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id),
  occupant_id     UUID NOT NULL REFERENCES occupants(id),
  billing_unit_id UUID NOT NULL REFERENCES billing_units(id),
  amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency        VARCHAR(10) NOT NULL DEFAULT 'TZS',
  method          VARCHAR(30) NOT NULL CHECK (method IN ('cash','mpesa','airtel_money','tigo_pesa','halopesa','bank_transfer')),
  transaction_ref VARCHAR(200),
  receipt_no      VARCHAR(30) NOT NULL UNIQUE,
  client_uuid     UUID NOT NULL UNIQUE,            -- idempotency: offline sync isidoublishe malipo
  collected_by    UUID REFERENCES users(id),       -- NULL = malipo ya mtandaoni (webhook)
  status          VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','reversed')),
  reversed_at     TIMESTAMPTZ,
  reversed_by     UUID REFERENCES users(id),
  reversal_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 7. Ledger (append-only). charge = +, payment = -, reversal = +
-- ---------------------------------------------------------------------
CREATE TABLE billing_ledger (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id),
  occupant_id     UUID NOT NULL REFERENCES occupants(id),
  billing_unit_id UUID NOT NULL REFERENCES billing_units(id),
  entry_type      VARCHAR(20) NOT NULL CHECK (entry_type IN ('charge','payment','reversal','adjustment')),
  amount          NUMERIC(12,2) NOT NULL,
  period          DATE,                            -- siku ya kwanza ya mwezi (kwa charge)
  payment_id      UUID REFERENCES unit_payments(id),
  reason          TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (entry_type <> 'charge'   OR (amount > 0 AND period IS NOT NULL)),
  CHECK (entry_type <> 'payment'  OR (amount < 0 AND payment_id IS NOT NULL)),
  CHECK (entry_type <> 'reversal' OR (amount > 0 AND payment_id IS NOT NULL)),
  CHECK (entry_type <> 'adjustment' OR reason IS NOT NULL)
);
-- Mtu mmoja hatozwi mara mbili kwa mwezi mmoja
CREATE UNIQUE INDEX one_charge_per_period ON billing_ledger(occupant_id, period) WHERE entry_type = 'charge';

CREATE FUNCTION billing_ledger_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'billing_ledger is append-only; use a reversal or adjustment entry';
END $$;
CREATE TRIGGER trg_ledger_immutable BEFORE UPDATE OR DELETE ON billing_ledger
  FOR EACH ROW EXECUTE FUNCTION billing_ledger_immutable();

-- ---------------------------------------------------------------------
-- 8. Kufunga siku ya mkusanyaji
-- ---------------------------------------------------------------------
CREATE TABLE collector_shifts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id),
  collector_id  UUID NOT NULL REFERENCES users(id),
  shift_date    DATE NOT NULL,
  expected_cash NUMERIC(12,2) NOT NULL DEFAULT 0,  -- jumla ya cash kwenye mfumo
  declared_cash NUMERIC(12,2),                     -- kiasi alichowasilisha
  status        VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','submitted','discrepancy','confirmed')),
  notes         TEXT,
  submitted_at  TIMESTAMPTZ,
  confirmed_by  UUID REFERENCES users(id),
  confirmed_at  TIMESTAMPTZ,
  UNIQUE (collector_id, shift_date)
);

-- ---------------------------------------------------------------------
-- 9. Indexes
-- ---------------------------------------------------------------------
CREATE INDEX idx_properties_company_ward ON properties(company_id, ward_id);
CREATE INDEX idx_units_property          ON billing_units(property_id);
CREATE INDEX idx_units_company           ON billing_units(company_id);
CREATE INDEX idx_occupants_unit          ON occupants(billing_unit_id);
CREATE INDEX idx_ledger_occupant         ON billing_ledger(occupant_id);
CREATE INDEX idx_ledger_unit             ON billing_ledger(billing_unit_id);
CREATE INDEX idx_unit_payments_unit      ON unit_payments(billing_unit_id);
CREATE INDEX idx_unit_payments_collector ON unit_payments(collected_by, created_at);

-- ---------------------------------------------------------------------
-- 10. Triggers: code, company_id kutoka kwa mzazi, status ya unit, fee plan
-- ---------------------------------------------------------------------
CREATE FUNCTION luhn_check_digit(p_digits TEXT) RETURNS INT
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE i INT; d INT; s INT := 0; dbl BOOLEAN := true;
BEGIN
  FOR i IN REVERSE length(p_digits)..1 LOOP
    d := substr(p_digits, i, 1)::INT;
    IF dbl THEN d := d * 2; IF d > 9 THEN d := d - 9; END IF; END IF;
    s := s + d; dbl := NOT dbl;
  END LOOP;
  RETURN (10 - (s % 10)) % 10;
END $$;

-- Code: WC-123456-7 (tarakimu ya mwisho ni check digit ya kuzuia makosa ya kuandika)
CREATE FUNCTION next_unit_code() RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE v_n TEXT := lpad(nextval('billing_unit_code_seq')::TEXT, 6, '0');
BEGIN
  RETURN 'WC-' || v_n || '-' || luhn_check_digit(v_n)::TEXT;
END $$;

CREATE FUNCTION trg_billing_units_before() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.company_id := (SELECT company_id FROM properties WHERE id = NEW.property_id);
    IF NEW.company_id IS NULL THEN RAISE EXCEPTION 'property not found'; END IF;
    IF NEW.code IS NULL OR NEW.code = '' THEN NEW.code := next_unit_code(); END IF;
    NEW.status := 'vacant';
    IF NEW.fee_plan_id IS NULL THEN
      NEW.fee_plan_id := (
        SELECT id FROM fee_plans
        WHERE company_id = NEW.company_id AND unit_type = NEW.unit_type AND is_active
        ORDER BY created_at LIMIT 1);
    END IF;
  ELSE
    IF NEW.code <> OLD.code THEN RAISE EXCEPTION 'unit code cannot be changed'; END IF;
    IF NEW.company_id <> OLD.company_id OR NEW.property_id <> OLD.property_id THEN
      RAISE EXCEPTION 'unit cannot be moved to another property';
    END IF;
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_billing_units_before BEFORE INSERT OR UPDATE ON billing_units
  FOR EACH ROW EXECUTE FUNCTION trg_billing_units_before();

CREATE FUNCTION trg_occupants_before_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.company_id := (SELECT company_id FROM billing_units WHERE id = NEW.billing_unit_id);
  IF NEW.company_id IS NULL THEN RAISE EXCEPTION 'billing unit not found'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_occupants_before_insert BEFORE INSERT ON occupants
  FOR EACH ROW EXECUTE FUNCTION trg_occupants_before_insert();

-- Unit inakuwa active ikiwa na mkazi wa sasa, vinginevyo vacant
CREATE FUNCTION trg_occupants_sync_unit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE billing_units u
     SET status = CASE WHEN EXISTS (SELECT 1 FROM occupants o WHERE o.billing_unit_id = u.id AND o.moved_out IS NULL)
                       THEN 'active' ELSE 'vacant' END
   WHERE u.id = NEW.billing_unit_id AND u.status <> 'inactive';
  RETURN NEW;
END $$;
CREATE TRIGGER trg_occupants_sync_unit AFTER INSERT OR UPDATE ON occupants
  FOR EACH ROW EXECUTE FUNCTION trg_occupants_sync_unit();

CREATE FUNCTION trg_touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END $$;
CREATE TRIGGER trg_properties_touch BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION trg_touch_updated_at();

-- ---------------------------------------------------------------------
-- 11. RLS helper functions
-- (SECURITY DEFINER ili kuepuka recursion kwenye RLS ya `users`)
-- ---------------------------------------------------------------------
CREATE FUNCTION hh_is_super() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin');
$$;

CREATE FUNCTION hh_is_admin(p_company UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT hh_is_super()
      OR EXISTS (SELECT 1 FROM companies WHERE id = p_company AND admin_id = auth.uid());
$$;

CREATE FUNCTION hh_is_collector(p_company UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM collectors
                  WHERE user_id = auth.uid() AND company_id = p_company AND is_active);
$$;

CREATE FUNCTION hh_can_see_ward(p_company UUID, p_ward UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT hh_is_admin(p_company)
      OR (hh_is_collector(p_company) AND (
            NOT EXISTS (SELECT 1 FROM collector_wards WHERE collector_id = auth.uid())
            OR EXISTS (SELECT 1 FROM collector_wards WHERE collector_id = auth.uid() AND ward_id = p_ward)));
$$;

CREATE FUNCTION hh_can_access_property(p_property UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT hh_can_see_ward(pr.company_id, pr.ward_id)
                     FROM properties pr WHERE pr.id = p_property), false);
$$;

CREATE FUNCTION hh_can_access_unit(p_unit UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT hh_can_access_property(u.property_id)
                     FROM billing_units u WHERE u.id = p_unit), false);
$$;

-- ---------------------------------------------------------------------
-- 12. RLS policies
-- Ledger, unit_payments na shifts: SELECT tu. Uandishi unapitia functions.
-- ---------------------------------------------------------------------
ALTER TABLE collectors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE collector_wards   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_plans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties        ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_units     ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_ledger    ENABLE ROW LEVEL SECURITY;
ALTER TABLE collector_shifts  ENABLE ROW LEVEL SECURITY;

CREATE POLICY collectors_select ON collectors FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR hh_is_admin(company_id));
CREATE POLICY collectors_admin  ON collectors FOR ALL TO authenticated
  USING (hh_is_admin(company_id)) WITH CHECK (hh_is_admin(company_id));

CREATE POLICY collector_wards_select ON collector_wards FOR SELECT TO authenticated
  USING (collector_id = auth.uid()
         OR EXISTS (SELECT 1 FROM collectors c WHERE c.user_id = collector_id AND hh_is_admin(c.company_id)));
CREATE POLICY collector_wards_admin ON collector_wards FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM collectors c WHERE c.user_id = collector_id AND hh_is_admin(c.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM collectors c WHERE c.user_id = collector_id AND hh_is_admin(c.company_id)));

CREATE POLICY fee_plans_select ON fee_plans FOR SELECT TO authenticated
  USING (hh_is_admin(company_id) OR hh_is_collector(company_id));
CREATE POLICY fee_plans_admin  ON fee_plans FOR ALL TO authenticated
  USING (hh_is_admin(company_id)) WITH CHECK (hh_is_admin(company_id));

-- properties: policy haisomi jedwali lenyewe (INSERT ... RETURNING inafanya kazi)
CREATE POLICY properties_select ON properties FOR SELECT TO authenticated
  USING (hh_can_see_ward(company_id, ward_id));
CREATE POLICY properties_insert ON properties FOR INSERT TO authenticated
  WITH CHECK (hh_can_see_ward(company_id, ward_id));
CREATE POLICY properties_update ON properties FOR UPDATE TO authenticated
  USING (hh_can_see_ward(company_id, ward_id)) WITH CHECK (hh_can_see_ward(company_id, ward_id));

CREATE POLICY units_select ON billing_units FOR SELECT TO authenticated
  USING (hh_can_access_property(property_id));
CREATE POLICY units_insert ON billing_units FOR INSERT TO authenticated
  WITH CHECK (hh_can_access_property(property_id));
CREATE POLICY units_update ON billing_units FOR UPDATE TO authenticated
  USING (hh_can_access_property(property_id)) WITH CHECK (hh_can_access_property(property_id));

CREATE POLICY occupants_select ON occupants FOR SELECT TO authenticated
  USING (hh_can_access_unit(billing_unit_id));
CREATE POLICY occupants_insert ON occupants FOR INSERT TO authenticated
  WITH CHECK (hh_can_access_unit(billing_unit_id));
CREATE POLICY occupants_update ON occupants FOR UPDATE TO authenticated
  USING (hh_can_access_unit(billing_unit_id)) WITH CHECK (hh_can_access_unit(billing_unit_id));

CREATE POLICY unit_payments_select ON unit_payments FOR SELECT TO authenticated
  USING (hh_can_access_unit(billing_unit_id));
CREATE POLICY ledger_select ON billing_ledger FOR SELECT TO authenticated
  USING (hh_can_access_unit(billing_unit_id));

CREATE POLICY shifts_select ON collector_shifts FOR SELECT TO authenticated
  USING (collector_id = auth.uid() OR hh_is_admin(company_id));

-- ---------------------------------------------------------------------
-- 13. Functions za biashara
-- ---------------------------------------------------------------------

-- Ndani: haipatikani kwa watumiaji. Inatumiwa na record_payment* na webhook (service_role).
CREATE FUNCTION apply_unit_payment(
  p_occupant_id UUID, p_amount NUMERIC, p_method TEXT,
  p_client_uuid UUID, p_ref TEXT, p_collector UUID
) RETURNS unit_payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_occ occupants; v_pay unit_payments;
BEGIN
  SELECT * INTO v_pay FROM unit_payments WHERE client_uuid = p_client_uuid;
  IF FOUND THEN RETURN v_pay; END IF;                -- retry ya offline: rudisha risiti ile ile

  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;
  SELECT * INTO v_occ FROM occupants WHERE id = p_occupant_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'occupant not found'; END IF;

  INSERT INTO unit_payments (company_id, occupant_id, billing_unit_id, amount, method,
                             transaction_ref, receipt_no, client_uuid, collected_by)
  VALUES (v_occ.company_id, v_occ.id, v_occ.billing_unit_id, p_amount, p_method, p_ref,
          'RC-' || to_char(NOW(), 'YYMM') || '-' || lpad(nextval('receipt_seq')::TEXT, 6, '0'),
          p_client_uuid, p_collector)
  RETURNING * INTO v_pay;

  INSERT INTO billing_ledger (company_id, occupant_id, billing_unit_id, entry_type, amount, payment_id, created_by)
  VALUES (v_occ.company_id, v_occ.id, v_occ.billing_unit_id, 'payment', -p_amount, v_pay.id, p_collector);

  INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (p_collector, 'payment_recorded', 'unit_payments', v_pay.id,
          jsonb_build_object('amount', p_amount, 'method', p_method, 'receipt_no', v_pay.receipt_no));
  RETURN v_pay;
END $$;

-- Mkusanyaji anapokea malipo kwa code ya kitengo (scan/andika)
CREATE FUNCTION record_payment(
  p_unit_code TEXT, p_amount NUMERIC, p_method TEXT DEFAULT 'cash',
  p_client_uuid UUID DEFAULT gen_random_uuid(), p_ref TEXT DEFAULT NULL
) RETURNS unit_payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_unit billing_units; v_occ_id UUID;
BEGIN
  SELECT * INTO v_unit FROM billing_units WHERE code = upper(trim(p_unit_code));
  IF NOT FOUND THEN RAISE EXCEPTION 'unit code not found'; END IF;
  IF NOT hh_can_access_unit(v_unit.id) THEN RAISE EXCEPTION 'not allowed for this area'; END IF;
  SELECT id INTO v_occ_id FROM occupants WHERE billing_unit_id = v_unit.id AND moved_out IS NULL;
  IF v_occ_id IS NULL THEN RAISE EXCEPTION 'unit is vacant: no occupant to bill'; END IF;
  RETURN apply_unit_payment(v_occ_id, p_amount, p_method, p_client_uuid, p_ref, auth.uid());
END $$;

-- Mtu aliyehama analipa deni lake la zamani
CREATE FUNCTION record_payment_for_occupant(
  p_occupant_id UUID, p_amount NUMERIC, p_method TEXT DEFAULT 'cash',
  p_client_uuid UUID DEFAULT gen_random_uuid(), p_ref TEXT DEFAULT NULL
) RETURNS unit_payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_unit UUID;
BEGIN
  SELECT billing_unit_id INTO v_unit FROM occupants WHERE id = p_occupant_id;
  IF v_unit IS NULL OR NOT hh_can_access_unit(v_unit) THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN apply_unit_payment(p_occupant_id, p_amount, p_method, p_client_uuid, p_ref, auth.uid());
END $$;

-- Kurekebisha kosa: admin tu, na sababu ni lazima
CREATE FUNCTION reverse_payment(p_payment_id UUID, p_reason TEXT) RETURNS unit_payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pay unit_payments;
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN RAISE EXCEPTION 'reason is required'; END IF;
  SELECT * INTO v_pay FROM unit_payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment not found'; END IF;
  IF NOT hh_is_admin(v_pay.company_id) THEN RAISE EXCEPTION 'only an admin can reverse a payment'; END IF;
  IF v_pay.status <> 'completed' THEN RAISE EXCEPTION 'payment already reversed'; END IF;

  UPDATE unit_payments
     SET status = 'reversed', reversed_at = NOW(), reversed_by = auth.uid(), reversal_reason = p_reason
   WHERE id = p_payment_id RETURNING * INTO v_pay;

  INSERT INTO billing_ledger (company_id, occupant_id, billing_unit_id, entry_type, amount, payment_id, reason, created_by)
  VALUES (v_pay.company_id, v_pay.occupant_id, v_pay.billing_unit_id, 'reversal', v_pay.amount, v_pay.id, p_reason, auth.uid());

  INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (auth.uid(), 'payment_reversed', 'unit_payments', v_pay.id,
          jsonb_build_object('amount', v_pay.amount, 'reason', p_reason, 'receipt_no', v_pay.receipt_no));
  RETURN v_pay;
END $$;

-- Mpangaji anahama: deni linabaki kwake, unit inakuwa vacant
CREATE FUNCTION move_out_occupant(p_occupant_id UUID, p_date DATE DEFAULT CURRENT_DATE) RETURNS occupants
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_occ occupants;
BEGIN
  SELECT * INTO v_occ FROM occupants WHERE id = p_occupant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'occupant not found'; END IF;
  IF NOT hh_can_access_unit(v_occ.billing_unit_id) THEN RAISE EXCEPTION 'not allowed'; END IF;
  IF v_occ.moved_out IS NOT NULL THEN RAISE EXCEPTION 'occupant already moved out'; END IF;
  UPDATE occupants SET moved_out = GREATEST(p_date, moved_in) WHERE id = p_occupant_id RETURNING * INTO v_occ;
  RETURN v_occ;
END $$;

-- Madeni ya mwezi: wakazi waliokuwepo tarehe 1 ya mwezi (anayeingia katikati ya mwezi anaanza mwezi unaofuata).
-- Salama kuiita tena (idempotent). Inaitwa na admin au cron (service_role).
CREATE FUNCTION generate_monthly_charges(
  p_company UUID, p_period DATE DEFAULT date_trunc('month', CURRENT_DATE)::DATE
) RETURNS TABLE (charges_created INT, units_without_fee_plan INT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_period DATE := date_trunc('month', p_period)::DATE; v_created INT; v_noplan INT;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT hh_is_admin(p_company) THEN
    RAISE EXCEPTION 'only an admin can generate charges';
  END IF;

  INSERT INTO billing_ledger (company_id, occupant_id, billing_unit_id, entry_type, amount, period, reason, created_by)
  SELECT u.company_id, o.id, u.id, 'charge', fp.amount, v_period, 'monthly fee', auth.uid()
    FROM billing_units u
    JOIN occupants o  ON o.billing_unit_id = u.id
                     AND o.moved_in <= v_period
                     AND (o.moved_out IS NULL OR o.moved_out > v_period)
    JOIN fee_plans fp ON fp.id = u.fee_plan_id AND fp.is_active
   WHERE u.company_id = p_company AND u.status <> 'inactive'
  ON CONFLICT (occupant_id, period) WHERE entry_type = 'charge' DO NOTHING;
  GET DIAGNOSTICS v_created = ROW_COUNT;

  SELECT COUNT(*) INTO v_noplan
    FROM billing_units u
    JOIN occupants o ON o.billing_unit_id = u.id AND o.moved_out IS NULL
   WHERE u.company_id = p_company AND u.fee_plan_id IS NULL;

  RETURN QUERY SELECT v_created, v_noplan;
END $$;

-- Kufunga siku (mkusanyaji)
CREATE FUNCTION submit_shift(p_declared NUMERIC, p_notes TEXT DEFAULT NULL) RETURNS collector_shifts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company UUID; v_date DATE := (NOW() AT TIME ZONE 'Africa/Dar_es_Salaam')::DATE;
  v_expected NUMERIC; v_shift collector_shifts;
BEGIN
  SELECT company_id INTO v_company FROM collectors WHERE user_id = auth.uid() AND is_active;
  IF v_company IS NULL THEN RAISE EXCEPTION 'not a collector'; END IF;
  IF p_declared IS NULL OR p_declared < 0 THEN RAISE EXCEPTION 'invalid declared amount'; END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_expected
    FROM unit_payments
   WHERE collected_by = auth.uid() AND method = 'cash' AND status = 'completed'
     AND (created_at AT TIME ZONE 'Africa/Dar_es_Salaam')::DATE = v_date;

  INSERT INTO collector_shifts (company_id, collector_id, shift_date, expected_cash, declared_cash, status, notes, submitted_at)
  VALUES (v_company, auth.uid(), v_date, v_expected, p_declared,
          CASE WHEN p_declared = v_expected THEN 'submitted' ELSE 'discrepancy' END, p_notes, NOW())
  ON CONFLICT (collector_id, shift_date) DO UPDATE
     SET expected_cash = EXCLUDED.expected_cash, declared_cash = EXCLUDED.declared_cash,
         status = EXCLUDED.status, notes = EXCLUDED.notes, submitted_at = NOW()
   WHERE collector_shifts.status <> 'confirmed'
  RETURNING * INTO v_shift;

  IF v_shift.id IS NULL THEN RAISE EXCEPTION 'shift already confirmed'; END IF;
  RETURN v_shift;
END $$;

CREATE FUNCTION confirm_shift(p_shift_id UUID, p_notes TEXT DEFAULT NULL) RETURNS collector_shifts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_shift collector_shifts;
BEGIN
  SELECT * INTO v_shift FROM collector_shifts WHERE id = p_shift_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'shift not found'; END IF;
  IF NOT hh_is_admin(v_shift.company_id) THEN RAISE EXCEPTION 'only an admin can confirm'; END IF;
  UPDATE collector_shifts
     SET status = 'confirmed', confirmed_by = auth.uid(), confirmed_at = NOW(),
         notes = COALESCE(p_notes, notes)
   WHERE id = p_shift_id RETURNING * INTO v_shift;
  RETURN v_shift;
END $$;

-- ---------------------------------------------------------------------
-- 14. Views (security_invoker: RLS ya mtumiaji inatumika)
-- ---------------------------------------------------------------------

-- Deni la kila mtu (pamoja na waliohama)
CREATE VIEW v_occupant_balances WITH (security_invoker = true) AS
SELECT o.id AS occupant_id, o.company_id, o.billing_unit_id, o.full_name, o.phone,
       o.moved_in, o.moved_out, (o.moved_out IS NULL) AS is_current,
       COALESCE(SUM(l.amount) FILTER (WHERE l.entry_type = 'charge'), 0)                  AS billed,
       -COALESCE(SUM(l.amount) FILTER (WHERE l.entry_type IN ('payment','reversal')), 0)  AS paid,
       COALESCE(SUM(l.amount), 0)                                                         AS balance
  FROM occupants o
  LEFT JOIN billing_ledger l ON l.occupant_id = o.id
 GROUP BY o.id;

-- Hali ya kila kitengo (scan ya code -> taarifa zote)
CREATE VIEW v_unit_status WITH (security_invoker = true) AS
SELECT u.id AS billing_unit_id, u.company_id, u.property_id, u.code, u.unit_type, u.label, u.status,
       p.ward_id, p.location_lat, p.location_lng, p.address,
       b.occupant_id, b.full_name, b.phone, b.balance,
       CASE
         WHEN b.occupant_id IS NULL THEN 'vacant'
         WHEN b.balance <= 0        THEN 'paid'
         WHEN EXISTS (SELECT 1 FROM unit_payments up
                       WHERE up.occupant_id = b.occupant_id AND up.status = 'completed'
                         AND up.created_at >= date_trunc('month', NOW())) THEN 'partial'
         ELSE 'unpaid'
       END AS pay_status
  FROM billing_units u
  JOIN properties p ON p.id = u.property_id
  LEFT JOIN v_occupant_balances b ON b.billing_unit_id = u.id AND b.is_current;

-- Pini za ramani: rangi ya nyumba = hali mbaya zaidi ya vitengo vyake
CREATE VIEW v_property_map WITH (security_invoker = true) AS
SELECT p.id AS property_id, p.company_id, p.ward_id, p.property_type, p.owner_name,
       p.address, p.location_lat, p.location_lng,
       COUNT(s.billing_unit_id) FILTER (WHERE s.pay_status <> 'vacant')  AS units_occupied,
       COUNT(s.billing_unit_id) FILTER (WHERE s.pay_status = 'paid')     AS units_paid,
       COUNT(s.billing_unit_id) FILTER (WHERE s.pay_status = 'partial')  AS units_partial,
       COUNT(s.billing_unit_id) FILTER (WHERE s.pay_status = 'unpaid')   AS units_unpaid,
       COALESCE(SUM(GREATEST(s.balance, 0)), 0)                          AS total_debt,
       CASE
         WHEN COUNT(s.billing_unit_id) FILTER (WHERE s.pay_status = 'unpaid')  > 0 THEN 'unpaid'
         WHEN COUNT(s.billing_unit_id) FILTER (WHERE s.pay_status = 'partial') > 0 THEN 'partial'
         WHEN COUNT(s.billing_unit_id) FILTER (WHERE s.pay_status = 'paid')    > 0 THEN 'paid'
         ELSE 'vacant'
       END AS map_status
  FROM properties p
  LEFT JOIN v_unit_status s ON s.property_id = p.id
 GROUP BY p.id;

-- Mapato / yaliyobaki / madeni kwa eneo (ward). outstanding_total ni pamoja na madeni ya waliohama.
CREATE VIEW v_area_summary WITH (security_invoker = true) AS
SELECT p.company_id, p.ward_id, w.name AS ward_name,
       COUNT(DISTINCT u.id) FILTER (WHERE u.status = 'active') AS active_units,
       COALESCE(SUM(l.amount) FILTER (WHERE l.entry_type = 'charge'
                                        AND l.period = date_trunc('month', CURRENT_DATE)::DATE), 0) AS billed_this_month,
       -COALESCE(SUM(l.amount) FILTER (WHERE l.entry_type IN ('payment','reversal')
                                         AND l.created_at >= date_trunc('month', NOW())), 0)        AS collected_this_month,
       COALESCE(SUM(l.amount), 0) AS outstanding_total
  FROM properties p
  LEFT JOIN wards w          ON w.id = p.ward_id
  JOIN billing_units u       ON u.property_id = p.id
  LEFT JOIN billing_ledger l ON l.billing_unit_id = u.id
 GROUP BY p.company_id, p.ward_id, w.name;

-- ---------------------------------------------------------------------
-- 15. Ruhusa za functions
-- ---------------------------------------------------------------------
REVOKE ALL ON FUNCTION apply_unit_payment(UUID, NUMERIC, TEXT, UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION apply_unit_payment(UUID, NUMERIC, TEXT, UUID, TEXT, UUID) TO service_role;

REVOKE ALL ON FUNCTION generate_monthly_charges(UUID, DATE) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION generate_monthly_charges(UUID, DATE) TO authenticated, service_role;

REVOKE ALL ON FUNCTION record_payment(TEXT, NUMERIC, TEXT, UUID, TEXT)             FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION record_payment_for_occupant(UUID, NUMERIC, TEXT, UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION reverse_payment(UUID, TEXT)                                 FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION move_out_occupant(UUID, DATE)                               FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION submit_shift(NUMERIC, TEXT)                                 FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION confirm_shift(UUID, TEXT)                                   FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION record_payment(TEXT, NUMERIC, TEXT, UUID, TEXT)             TO authenticated;
GRANT EXECUTE ON FUNCTION record_payment_for_occupant(UUID, NUMERIC, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reverse_payment(UUID, TEXT)                                 TO authenticated;
GRANT EXECUTE ON FUNCTION move_out_occupant(UUID, DATE)                               TO authenticated;
GRANT EXECUTE ON FUNCTION submit_shift(NUMERIC, TEXT)                                 TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_shift(UUID, TEXT)                                   TO authenticated;

-- Helpers za RLS zinahitaji kuitwa na authenticated
REVOKE ALL ON FUNCTION hh_is_super(), hh_is_admin(UUID), hh_is_collector(UUID),
  hh_can_see_ward(UUID, UUID), hh_can_access_property(UUID), hh_can_access_unit(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION hh_is_super(), hh_is_admin(UUID), hh_is_collector(UUID),
  hh_can_see_ward(UUID, UUID), hh_can_access_property(UUID), hh_can_access_unit(UUID) TO authenticated;

-- ---------------------------------------------------------------------
-- Mfano wa kuanzisha ada (badilisha company_id na kiasi halisi):
-- INSERT INTO fee_plans (company_id, name, unit_type, amount) VALUES
--   ('<company-uuid>', 'Familia',    'family',   10000),
--   ('<company-uuid>', 'Mpangaji',   'tenant',   10000),
--   ('<company-uuid>', 'Mwenye nyumba (vyumba vyake)', 'landlord', 10000),
--   ('<company-uuid>', 'Duka dogo',  'business', 20000);
-- ---------------------------------------------------------------------
