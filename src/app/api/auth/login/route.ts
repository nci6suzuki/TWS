// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

// ブラウザで直接開かれた時（GET）は /login に逃がす
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login?error=missing", request.url), { status: 303 });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  // ★ ここが重要：sb-cookie をレスポンスに載せるための cookie jar
  const cookieJar: Array<{ name: string; value: string; options?: any }> = [];

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // request側にも反映（連続処理で参照されることがある）
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        // 返却用に保持（redirectレスポンスに積む）
        cookieJar.length = 0;
        cookiesToSet.forEach((c) => cookieJar.push(c));
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url), { status: 303 });
  }

  // ★ 成功：redirectレスポンスに sb-cookie を積む
  const response = NextResponse.redirect(new URL("/dashboard", request.url), { status: 303 });

  cookieJar.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}