// src/lib/supabase/server-db.ts
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

async function getAccessTokenFromSbCookie(): Promise<string | null> {
  const cookieStore = await cookies(); // ★ await が必要
  const all = cookieStore.getAll();

  // sb-<project>-auth-token を探す
  const sb = all.find(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );
  if (!sb?.value) return null;

  const raw = sb.value.startsWith("base64-")
    ? sb.value.slice("base64-".length)
    : sb.value;

  try {
    // Edge runtime でも動くよう Buffer を使わず atob を使う
    const json = JSON.parse(atob(raw));
    return json?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function createSupabaseServerDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const accessToken = await getAccessTokenFromSbCookie();

  return createClient(url, anon, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}