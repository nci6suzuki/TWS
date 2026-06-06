import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DebugAuthPage() {
  const supabase = await createSupabaseServerClient();

  const { data: userData, error: userErr } = await supabase.auth.getUser();

  const uid = userData?.user?.id ?? null;

  const { data: emp, error: empErr } = uid
    ? await supabase
        .from("employees")
        .select("id, employee_code, app_role, user_id, email")
        .eq("user_id", uid)
        .maybeSingle()
    : { data: null, error: null };

  return (
    <div className="p-6 space-y-4">
      <div className="rounded-2xl border bg-white p-4">
        <div className="font-bold">Auth.getUser()</div>
        <pre className="text-xs mt-2 whitespace-pre-wrap">
{JSON.stringify({ uid, userErr: userErr?.message ?? null }, null, 2)}
        </pre>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="font-bold">employees lookup (by user_id)</div>
        <pre className="text-xs mt-2 whitespace-pre-wrap">
{JSON.stringify({ emp, empErr: empErr?.message ?? null }, null, 2)}
        </pre>
      </div>
    </div>
  );
}