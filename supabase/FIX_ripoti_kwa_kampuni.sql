-- ============================================================
-- A. KAGUA KWANZA (inasoma tu) — ni nani ni nani?
-- ============================================================
select id, email, role from users
where role in ('company_admin','super_admin','municipality_admin') order by role, email;

-- ============================================================
-- B. UNGANISHA ADMIN SAHIHI NA KAMPUNI (badilisha thamani mbili)
--    <ID_YA_ADMIN> = id ya admin kutoka query A
--    Kampuni: Temeke = 6790e857-080d-4b38-bb26-0eefbcc19bd0
--             Blella = aa1b017b-c628-44c5-beac-cade18584bc7
-- ============================================================
-- update companies set admin_id = '<ID_YA_ADMIN>'
-- where id = '6790e857-080d-4b38-bb26-0eefbcc19bd0';

-- ============================================================
-- C. USALAMA: kila admin aone ripoti za kampuni yake tu
--    (sera za zamani zilimruhusu kila admin kuona ripoti ZOTE)
--    Municipality admin anabaki na ufikiaji wake; super admin anaona
--    ripoti ZISIZO NA KAMPUNI tu (za kuelekeza).
-- ============================================================
begin;

drop policy if exists reports_select_own on waste_reports;
create policy reports_select_own on waste_reports for select using (
  auth.uid() = citizen_id
  or auth.uid() = assigned_to
  or exists (select 1 from users u where u.id = auth.uid() and u.role = 'municipality_admin')
  or (company_id is null and exists (select 1 from users u where u.id = auth.uid() and u.role = 'super_admin'))
);

drop policy if exists reports_update_admin on waste_reports;
create policy reports_update_admin on waste_reports for update using (
  auth.uid() = assigned_to
  or exists (select 1 from users u where u.id = auth.uid() and u.role = 'municipality_admin')
  or (company_id is null and exists (select 1 from users u where u.id = auth.uid() and u.role = 'super_admin'))
);
-- (reports_company_select / reports_company_update zilizopo tayari zinawapa admin wa kampuni ripoti zao)

commit;

-- ============================================================
-- D. ELEKEZA RIPOTI ZA ZAMANI (baada ya kuipa kampuni kata zake)
--    Inaelekeza tu kata zenye kampuni MOJA; zenye zaidi ya moja zinabaki kwa mwananchi/super admin.
-- ============================================================
update waste_reports r
set company_id = x.company_id
from (
  select ward_id, min(company_id::text)::uuid as company_id
  from company_wards group by ward_id having count(*) = 1
) x
where r.company_id is null and r.ward_id = x.ward_id;
