import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const supabase = createSupabaseServerClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("id, initial_profile_completed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (employee && !employee.initial_profile_completed_at) {
    return NextResponse.redirect(`${origin}/welcome/setup-profile`);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}