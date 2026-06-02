// src/lib/supabase/server-auth.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export async function createSupabaseServerAuthClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  // ★ここがポイント：あなたの環境では cookies() が Promise なので await が必要
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        // Next の型によっては Readonly なので any で回避
        (cookieStore as any).set?.({ name, value, ...options });
      },
      remove(name: string, options: any) {
        (cookieStore as any).set?.({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
}

// 互換用：今後は使わない想定
export async function getTmAccessToken() {
  return undefined;
}