import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const me = await requireAuthApi();
    const body = await req.json();
    const supabase = await createSupabaseServerClient();

    const { error: goalsErr } = await supabase
      .from("employee_career_goals")
      .upsert(
        {
          employee_id: me.employeeId,
          desired_role: body.desiredRole || null,
          desired_career_path: body.desiredCareerPath || null,
          goal_1y: body.goal1y || null,
          goal_3y: body.goal3y || null,
          self_comment: body.selfComment || null,
        },
        { onConflict: "employee_id" }
      );

    if (goalsErr) throw goalsErr;

    const { error: employeeErr } = await supabase
      .from("employees")
      .update({
        initial_profile_completed_at: new Date().toISOString(),
      })
      .eq("id", me.employeeId);

    if (employeeErr) throw employeeErr;

    if (body.newPassword) {
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: req.headers.get("Authorization") ?? "",
            },
          },
        }
      );

      const { error: pwErr } = await supabaseAuth.auth.updateUser({
        password: body.newPassword,
      });

      if (pwErr) throw pwErr;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "ERROR", message: e?.message ?? "初回設定に失敗しました" },
      },
      { status: 500 }
    );
  }
}