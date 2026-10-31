import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Admin wa kampuni anamsajili dereva au mkusanyaji WA KAMPUNI YAKE.
 * - Super admin haruhusiwi (kampuni zinasimamia wafanyakazi wao wenyewe).
 * - Mtu hawezi kujiandikisha mwenyewe kama dereva; akaunti inaundwa hapa tu.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Hakuna ruhusa (Authorization header haipo)" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerData.user) return json({ error: "Session si sahihi" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const {
      company_id, role, first_name, last_name, email, phone, password,
      license_number, employee_id, ward_ids,
    } = body ?? {};

    if (!company_id || !email || !password || !first_name || !role) {
      return json({ error: "Jaza jina, barua pepe, nenosiri na aina ya mfanyakazi" }, 400);
    }
    if (!["driver", "collector"].includes(role)) {
      return json({ error: "Aina ya mfanyakazi isiyoruhusiwa" }, 400);
    }
    if (String(password).length < 8) {
      return json({ error: "Nenosiri liwe na angalau herufi 8" }, 400);
    }

    // Mwombaji lazima awe admin wa kampuni hiyo hiyo
    const { data: company } = await admin
      .from("companies")
      .select("id, admin_id")
      .eq("id", company_id)
      .maybeSingle();
    if (!company || company.admin_id !== callerData.user.id) {
      return json({ error: "Ruhusa hairuhusiwi — admin wa kampuni hii pekee" }, 403);
    }

    // 1) Akaunti ya auth (role inatolewa kwenye metadata; handle_new_user itaunda wasifu)
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name: last_name || "",
        phone: phone || "",
        role: role === "driver" ? "driver" : "citizen",
        company_id,
      },
    });
    if (createError || !created?.user) {
      return json({ error: createError?.message || "Imeshindikana kuunda akaunti" }, 400);
    }
    const uid = created.user.id;

    // 2) Hakikisha wasifu wa users uko sahihi (role + jina + simu)
    const dbRole = role === "driver" ? "driver" : "citizen";
    const { error: profileErr } = await admin
      .from("users")
      .update({
        role: dbRole,
        first_name,
        last_name: last_name || "",
        phone: phone || null,
        is_active: true,
        is_verified: true,
      })
      .eq("id", uid);
    if (profileErr) {
      await admin.auth.admin.deleteUser(uid);
      return json({ error: "Wasifu umeshindwa kuundwa: " + profileErr.message }, 400);
    }

    // 3) Unganisha na kampuni
    if (role === "driver") {
      const { error: drvErr } = await admin.from("drivers").upsert(
        {
          user_id: uid,
          company_id,
          employee_id: employee_id || null,
          license_number: license_number || null,
          is_available: true,
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: callerData.user.id,
        },
        { onConflict: "user_id" },
      );
      if (drvErr) {
        await admin.auth.admin.deleteUser(uid);
        return json({ error: "Dereva ameshindwa kuunganishwa na kampuni: " + drvErr.message }, 400);
      }
    } else {
      // Mkusanyaji: tumia function ya database (add_collector) kwa jina la admin,
      // ili role, jedwali la collectors na kata zote ziwekwe kwa sheria za DB.
      const { error: colErr } = await callerClient.rpc("add_collector", {
        p_company: company_id,
        p_email: email,
        p_ward_ids: Array.isArray(ward_ids) ? ward_ids : [],
      });
      if (colErr) {
        await admin.auth.admin.deleteUser(uid);
        return json({ error: "Mkusanyaji ameshindwa kuunganishwa na kampuni: " + colErr.message }, 400);
      }
    }

    return json({ user_id: uid });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});