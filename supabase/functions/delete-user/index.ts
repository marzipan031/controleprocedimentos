// Supabase Edge Function: delete-user
//
// Deletes an auth.users row (and, via the ON DELETE CASCADE on public.profiles,
// its profile row too). Must run with the service_role key, which is only
// available server-side as a Supabase secret — never ship it to the client.
//
// Deploy:   supabase functions deploy delete-user
// Secrets:  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided
//           automatically by the Supabase platform for Edge Functions.
//
// Called from the client via:
//   supabase.functions.invoke("delete-user", { body: { userId } })
// The caller's JWT is forwarded automatically; this function checks that the
// caller is an approved admin before deleting anyone.

import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Não autenticado." }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Client scoped to the caller's JWT, only used to verify who is asking.
  const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: caller },
  } = await callerClient.auth.getUser();
  if (!caller) {
    return new Response(JSON.stringify({ error: "Não autenticado." }), { status: 401 });
  }

  const { data: callerProfile } = await callerClient
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Apenas administradores podem excluir cadastros." }), {
      status: 403,
    });
  }

  const { userId } = await req.json();
  if (!userId || typeof userId !== "string") {
    return new Response(JSON.stringify({ error: "userId é obrigatório." }), { status: 400 });
  }

  // Admin client with the service role key — bypasses RLS, can delete auth users.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
