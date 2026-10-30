# WasteCollect — Marekebisho (Oktoba 2026)

## Hatua za kuweka (kwa mpangilio)
1. Futa folda ya zamani ya project, toa zip hii.
2. `npm install` (hakuna dependency mpya iliyoongezwa).
3. Deploy Edge Function mpya (mara moja):
   `npx supabase functions deploy create-company-staff`
   (inatumia SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY — Supabase huziweka yenyewe).
4. Migrations: ZILE TATU ULIZOZIRUN TAYARI zinatosha. Hakuna SQL mpya kwenye zip hii.
5. `npm run dev` kujaribu, `npm run build` kwa production.

## Yaliyobadilika
1. Usajili wa dereva umeondolewa kwenye `RegisterPage` (role ni `citizen` kila mara).
2. Dereva/mkusanyaji anasajiliwa na admin wa kampuni: ukurasa mpya `/collect/admin/staff` + Edge Function `create-company-staff`.
3. Ripoti ya taka: mwananchi anachagua kata (na kampuni kama kata ina zaidi ya moja). Admin wa kampuni anaona ripoti na madereva wa kampuni yake tu. Super admin anaona tu "Ripoti zisizo na kampuni" na kuziekeleza.
4. Kaya: kuhariri nyumba, kuhariri mkazi/jina la chumba, "Badilisha mkazi", "Deni la awali", na deni la nyuma/alishalipa wakati wa kusajili.
5. Super admin: hawezi tena kuingia `/collect/*`, `/admin/finance`, `/admin/dashboard`, `/analytics`, `/operational-kpis`; mapato/malipo yameondolewa kwenye dashboard na analytics yake. Super admin anaipa kampuni kata (kitufe cha MapPin kwenye Kampuni).
6. Demo: `/demo` (data za mfano, haigusi Supabase), kitufe kwenye ukurasa wa Login.

## Usafi wa typecheck (makosa 117 → 0)
- `DataTable`: constraint ya `Record<string, unknown>` ilibadilishwa kuwa `object` (ilisababisha makosa ~95, ikiwemo "imports hazitumiki" bandia).
- Imefutwa `src/pages/FleetManagementPage.tsx` (nakala ya zamani isiyotumika, iliyokuwa na njia za import zilizokosewa; ukurasa halisi ni `pages/superadmin/FleetManagementPage.tsx`).
- `PaymentHistoryPage`: `receipt_number` sasa ni hiari. `CreateComplaintPage`: variable isiyotumika imeondolewa. `fleetManagementService` na `systemSettingsService`: casts salama.
- Imethibitishwa: `npx tsc --noEmit -p tsconfig.app.json` = 0, `npx tsc -b --noEmit` = 0, `npm run build` inapita.

## Awamu ya 2
- Fomu ya "Ongeza kampuni" sasa ina "Sajili msimamizi mpya sasa" (jina, barua pepe, simu, nenosiri). Inaunda kampuni, kisha akaunti ya msimamizi (Edge Function `create-admin-user`), kisha inamuunganisha na kampuni.
- Ujumbe wa kosa la `create-company-staff` ukiwa haijawekwa (deploy) sasa unaeleweka kwa Kiswahili.

## Awamu ya 3 — Ramani
- Ramani (Leaflet) sasa ina picha za satelaiti + majina ya mitaa kama chaguo-msingi, na kitufe cha kubadili (juu kulia): Satelaiti + majina / Satelaiti / Ramani ya kawaida. Imewekwa kwenye ramani zote tatu (nyumba, ripoti, malori).
- Alama za kijani/njano/nyekundu hazijabadilika.
- "Street View" na "Elekea hapa" kwenye popup ya nyumba, ripoti, na ukurasa wa nyumba (viungo rasmi vya Google Maps, bila key).
- Hiari: weka `VITE_MAPBOX_TOKEN` (Vercel → Environment Variables) kupata Mapbox satellite-streets.
