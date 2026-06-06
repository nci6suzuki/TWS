import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login?error=missing", request.url), { status: 303 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const cookieJar: Array<{ name: string; value: string; options?: any }> = [];

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookieJar.length = 0;
        cookiesToSet.forEach((c) => cookieJar.push(c));
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url), { status: 303 });
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url), { status: 303 });
  cookieJar.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}