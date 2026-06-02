import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login?error=missing", request.url), { status: 303 });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE ENV is not set");
  }

  // ★ response を先に作り、setAll で sb cookie を詰める
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // request 側にも反映（次の処理で参照されることがあるため）
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        // response を作り直して cookie を積む
        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options as any);
        });
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url), { status: 303 });
  }

  // ★ sb cookie を載せた response のヘッダーを引き継いでリダイレクト
  const redirectResponse = NextResponse.redirect(new URL("/dashboard", request.url), { status: 303 });
  response.headers.forEach((value, key) => {
    redirectResponse.headers.set(key, value);
  });

  return redirectResponse;
}