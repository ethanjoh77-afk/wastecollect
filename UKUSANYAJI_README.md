# Ukusanyaji wa ada kwa kaya/vichwa (WasteCollect)

## Hatua za kuwasha (mara moja)
1. **SQL Editor (Supabase)**: endesha kwa mpangilio
   - `supabase/migrations/20261022120000_005_household_billing.sql`  (umeshaendesha)
   - `supabase/migrations/20261023090000_006_collection_helpers.sql`  (MPYA — endesha hii)
2. Kwenye laptop: `npm install` kisha `npm run dev`.
3. Ingia kama admin wa kampuni → **Ukusanyaji (admin) → Mipangilio**:
   - Weka ada: familia, mpangaji, mwenye nyumba, biashara.
   - Ongeza wakusanyaji (lazima wawe wamejisajili kwanza; weka barua pepe yao + kata zao).
4. Mkusanyaji akiingia anapelekwa moja kwa moja `/collect`.

## Kurasa
| Njia | Nani | Kazi |
|---|---|---|
| `/collect` | mkusanyaji, admin | Tafuta/scan code, muhtasari wa leo |
| `/collect/unit/:code` | mkusanyaji, admin | Deni, kupokea malipo, risiti, mkazi amehama |
| `/collect/map` | mkusanyaji, admin | Ramani: kijani=amelipa, njano=sehemu, nyekundu=hajalipa, kijivu=wazi |
| `/collect/register` | mkusanyaji, admin | Kusajili nyumba + GPS + vichwa (inafanya kazi offline) |
| `/collect/property/:id` | mkusanyaji, admin | Vichwa vya nyumba, sticker za QR |
| `/collect/shift` | mkusanyaji | Kufunga siku |
| `/collect/admin` | admin | Mapato/madeni kwa kata, wadaiwa, wakusanyaji, thibitisha siku, tengeneza madeni ya mwezi |
| `/collect/admin/setup` | admin | Ada na wakusanyaji |

## Kanuni za ada (zilizokubaliwa)
- Ada ni kwa **kichwa** (si chumba, si idadi ya watu).
- Nyumba ya familia = kichwa 1. Nyumba ya wapangaji = kichwa 1 kwa kila mpangaji.
- Mwenye nyumba anahesabiwa kichwa 1 tu kama anatumia vyumba; asipotumia, hana kichwa.
- Chumba/nyumba wazi hakizalishi deni. Mpangaji akihama, deni linabaki kwake.
- Biashara/duka zina ada yake (`fee_plans`, aina `business`).
- Madeni ya mwezi: wakazi waliokuwepo tarehe 1 ya mwezi; anayeingia katikati ya mwezi anaanza mwezi unaofuata.

## Offline
Malipo na usajili wa nyumba vikikosa mtandao vinahifadhiwa kwenye simu na kutumwa mtandao ukirudi
(hakuna kudoublika). Fungua app angalau mara moja ukiwa na mtandao ili iweze kufunguka offline.

## Bado haijafanywa
- Printa ya Bluetooth (sasa: Chapisha / SMS / Shiriki).
- Malipo ya M-Pesa ya mtandaoni kwenye `unit_payments` (webhook ita `apply_unit_payment` kwa service_role).
- SMS za vikumbusho kwa wadaiwa.
