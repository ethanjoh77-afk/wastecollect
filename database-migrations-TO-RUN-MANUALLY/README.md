# Jinsi ya Kuendesha Migration Hii

Faili hii (`004_operational_intelligence.sql`) IMEKUSUDIWA kuendeshwa MWENYEWE
kupitia **Supabase Dashboard → SQL Editor** — HAIKO kwenye folder ya
`supabase/migrations/` ili isijiendeshe moja kwa moja kwa CLI bila wewe
kuithibitisha kwanza.

## Hatua

1. Fungua Supabase Dashboard → project yako → **SQL Editor**.
2. Bandika content nzima ya `004_operational_intelligence.sql`.
3. Bonyeza **Run**.
4. Thibitisha kuwa hakuna error (migration ni additive tu — haiwezi kufuta
   data yoyote iliyopo).

## Inaongeza nini

- `waste_reports.route_id`, `waste_reports.vehicle_id`, `waste_reports.dispatched_at`
  — kuunganisha ripoti ya missed-pickup na dispatch halisi.
- Jedwali `fuel_logs` — kurekodi gharama za mafuta kwa gari/route.
- Jedwali `vehicle_alerts` — tahadhari za GPS (gari halijatuma location kwa muda).
- View `route_cost_summary` — muhtasari wa gharama kwa kila route (inatumiwa
  moja kwa moja na ukurasa mpya wa `/operational-kpis`).

Baada ya kuendesha hii, ukurasa mpya wa "Cost & GPS" kwenye sidebar (chini ya
Analytics) utaanza kuonyesha data halisi.
