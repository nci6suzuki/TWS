// src/app/debug/session/page.tsx
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DebugSessionPage() {
  const cookieStore = await cookies();
  const all = cookieStore.getAll();

  const sbCookies = all
    .filter((c) => c.name.startsWith("sb-"))
    .map((c) => ({ name: c.name, valuePreview: c.value.slice(0, 18) + "..." }));

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  const { data: uidFromDb, error: uidFromDbErr } = await supabase.rpc("current_user_id");

  const uid = data?.user?.id ?? null;
  
  const { data: emp, error: empErr } = uid
  ? await supabase
      .from("employees")
      .select("employee_code, app_role, user_id, email")
      .eq("user_id", uid)
      .maybeSingle()
  : { data: null, error: null };

  return (
    <div style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Debug / Session</h1>

      <h2 style={{ marginTop: 16, fontWeight: 700 }}>sb-* cookies</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(sbCookies, null, 2)}
      </pre>

      <h2 style={{ marginTop: 16, fontWeight: 700 }}>auth.getUser()</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(
          { uid: data?.user?.id ?? null, email: data?.user?.email ?? null, error: error?.message ?? null },
          null,
          2
        )}
      </pre>

      <h2 style={{ marginTop: 16, fontWeight: 700 }}>db rpc: current_user_id()</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify({ uidFromDb, uidFromDbErr: uidFromDbErr?.message ?? null }, null, 2)}
      </pre>

      <h2 style={{ marginTop: 16, fontWeight: 700 }}>employees lookup</h2>
<pre style={{ whiteSpace: "pre-wrap" }}>
  {JSON.stringify({ emp, empErr: empErr?.message ?? null }, null, 2)}
</pre>
    </div>
  );
}